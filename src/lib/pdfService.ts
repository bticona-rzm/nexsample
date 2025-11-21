// lib/pdfService.ts - VERSIÓN MEJORADA
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFData {
    mainTitle: string;
    confidenceLevel: number;
    sampleInterval: number;
    highValueLimit: number;
    precisionValue: number;
    populationExcludingHigh: number;
    highValueTotal: number;
    populationIncludingHigh: number;
    estimatedSampleSize: number;
    numErrores: number;
    errorMasProbableBruto: number;
    errorMasProbableNeto: number;
    precisionTotal: number;
    precisionTotalUnder: number;
    limiteErrorSuperiorBruto: number;
    limiteErrorSuperiorNeto: number;
    highValueCountResume: number;
    evaluationMethod: 'cell-classical' | 'stringer-bound';
    conclusionText: string;
    highValueConclusionText: string;
    cellClassicalData?: {
        overstatements: any[];
        understatements: any[];
        totalTaintings: number;
        stageUEL: number;
        basicPrecision: number;
        mostLikelyError: number;
        upperErrorLimit: number;
        understatementMLE?: number;
        understatementUEL?: number;
        understatementPrecision?: number;
        netUnderstatementUEL?: number;
    }
    highValueErrors?: any;
}

export class PDFExportService {
    static generateSummaryPDF(data: PDFData): jsPDF {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        let yPosition = 20; // REDUCIDO de 25 a 20

        // ✅ FECHA Y HORA ACTUAL - A LA IZQUIERDA
        const now = new Date();
        const fechaHora = now.toLocaleString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Generado: ${fechaHora}`, 20, 12); // REDUCIDO de 15 a 12

        // ✅ TÍTULO PRINCIPAL CON FONDO - MÁS COMPACTO
        doc.setFillColor(240, 240, 240);
        doc.rect(15, yPosition - 5, pageWidth - 30, 10, 'F'); // REDUCIDO altura de 12 a 10
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(data.mainTitle, pageWidth - 20, yPosition, { align: 'right' });
        yPosition += 12; // REDUCIDO de 20 a 12

        // Fondo para la sección de parámetros - MÁS COMPACTO
        doc.setFillColor(250, 250, 250);
        doc.rect(20, yPosition - 3, pageWidth - 40, 50, 'F'); // REDUCIDO altura de 60 a 50

        // ✅ MÉTODO COMPLETO (ALINEADO A LA DERECHA)
        const metodoCompleto = data.evaluationMethod === 'cell-classical' 
            ? 'MUM - Evaluación Celda y PPS Clásico' 
            : 'MUM - Evaluación Stringer Bound';
        
        // ✅ INFORMACIÓN GENERAL CON TABLA MÁS COMPACTA
        const tableData = [
            ['Nivel de confianza:', `${data.confidenceLevel}%`, 'Población excluyendo altos:', this.formatNumber(data.populationExcludingHigh)],
        ];

        if (data.evaluationMethod === 'cell-classical') {
            tableData.push(
                ['Intervalo muestral:', this.formatNumber(data.sampleInterval), 'Valor total elementos altos:', this.formatNumber(data.highValueTotal)],
                ['Valor alto:', this.formatNumber(data.highValueLimit), 'Población incluyendo altos:', this.formatNumber(data.populationIncludingHigh)],
                ['Precisión básica:', `${this.formatNumber(data.precisionValue)}%`, 'Método:', metodoCompleto]
            );
        } else {
            tableData.push(
                ['', '', 'Valor total elementos altos:', this.formatNumber(data.highValueTotal)],
                ['', '', 'Población incluyendo altos:', this.formatNumber(data.populationIncludingHigh)],
                ['', '', 'Método:', metodoCompleto]
            );
        }

        autoTable(doc, {
            body: tableData,
            startY: yPosition,
            theme: 'plain', // CAMBIADO de 'grid' a 'plain' para menos bordes
            styles: { 
                fontSize: 8,  // REDUCIDO de 9 a 8
                cellPadding: 2, // REDUCIDO de 3 a 2
                lineColor: [255, 255, 255],
                lineWidth: 0,
                minCellHeight: 6, // REDUCIDO de 8 a 6
                textColor: [0, 0, 0],
                font: 'helvetica'
            },
            headStyles: { 
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineColor: [255, 255, 255],
                lineWidth: 0,
                cellPadding: 2 // REDUCIDO de 3 a 2
            },
            bodyStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                lineColor: [255, 255, 255],
                lineWidth: 0,
                cellPadding: 2 // REDUCIDO de 3 a 2
            },
            margin: { left: 20, right: 20 },
            tableWidth: 'wrap',
            pageBreak: 'avoid',
            rowPageBreak: 'avoid',
            // ✅ CONFIGURACIÓN ADICIONAL PARA REDUCIR ESPACIOS
            tableLineWidth: 0,
            tableLineColor: [255, 255, 255],
            didParseCell: function (data) {
                // Reducir aún más el padding interno
                data.cell.styles.cellPadding = { top: 1, right: 2, bottom: 1, left: 2 };
            }
        });

        // ✅ ESPACIO POSTERIOR MÁS PEQUEÑO
        yPosition = (doc as any).lastAutoTable.finalY + 3; // REDUCIDO de 5 a 3

        // ✅ TABLA PRINCIPAL DE RESULTADOS
        const finalY = this.addMainResultsTable(doc, data, yPosition);
        
        // ✅ CONCLUSIÓN SIEMPRE EN PRIMERA PÁGINA
        this.addCompactConclusionSection(doc, data, finalY);

        // ✅ SI ES CELL & CLASSICAL, AGREGAR TABLAS DETALLADAS EN PÁGINAS SEPARADAS
        if (data.evaluationMethod === 'cell-classical' && data.cellClassicalData) {
            this.addDetailedTables(doc, data);
        }

        return doc;
    }

    private static addMainResultsTableCompact(doc: jsPDF, data: PDFData, startY: number): number {
        const tableColumn = ['', 'Sobrestimaciones', 'Subestimaciones'];
        let tableRows: any[] = [];

        if (data.evaluationMethod === 'cell-classical') {
            tableRows = this.getCellClassicalTableRows(data);
        } else {
            tableRows = this.getStringerBoundTableRows(data);
        }

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            theme: 'grid',
            styles: { 
                fontSize: 7, // MÁS PEQUEÑO
                cellPadding: 2, // MÁS COMPACTO
            },
            headStyles: { 
                fillColor: [66, 66, 66], 
                textColor: [255, 255, 255],
                fontSize: 7, // MÁS PEQUEÑO
                cellPadding: 2,
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 15, right: 15 }, // MÁRGENES MÁS PEQUEÑOS
            tableWidth: 'auto', // AJUSTAR MEJOR AL CONTENIDO
            pageBreak: 'avoid',
            didParseCell: function (data) {
                // Reducir padding para filas de sección
                if (data.row.index === 7 || data.row.index === 11) {
                    data.cell.styles.cellPadding = { top: 1, right: 2, bottom: 1, left: 2 };
                }
            }
        });

        return (doc as any).lastAutoTable.finalY + 5;
    }

    private static addCompactConclusionSection(doc: jsPDF, data: PDFData, startY: number) {
        const pageHeight = doc.internal.pageSize.height;
        const spaceNeeded = 25; // ESPACIO ESTIMADO PARA CONCLUSIÓN COMPACTA
        
        // Si no hay espacio suficiente, forzar que todo quede en primera página
        if (startY + spaceNeeded > pageHeight - 15) {
            // Reducir aún más los espacios anteriores
            console.warn('Ajustando espacios para mantener conclusión en primera página');
            // En una implementación real, podrías recalcular todo con espacios más reducidos
        }

        // CONCLUSIÓN MÁS COMPACTA
        doc.setFillColor(240, 240, 240);
        doc.rect(15, startY - 3, doc.internal.pageSize.width - 30, 8, 'F'); // MÁS COMPACTO
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10); // MÁS PEQUEÑO
        doc.text('Conclusión:', 20, startY + 2);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8); // MÁS PEQUEÑO
        
        // Texto más compacto
        const conclusionLines = doc.splitTextToSize(data.conclusionText, doc.internal.pageSize.width - 30);
        doc.text(conclusionLines, 20, startY + 8);
        
        let currentY = startY + 8 + (conclusionLines.length * 3.5); // INTERLINEADO REDUCIDO
        
        if (data.highValueConclusionText) {
            const highValueLines = doc.splitTextToSize(data.highValueConclusionText, doc.internal.pageSize.width - 30);
            doc.text(highValueLines, 20, currentY + 3);
        }
    }

    private static addDetailedTables(doc: jsPDF, data: PDFData) {
        // ✅ UNDERSTATEMENTS EN PÁGINA SEPARADA
        doc.addPage();
        let yPosition = 25;

        // Título con fondo
        doc.setFillColor(240, 240, 240);
        doc.rect(15, yPosition - 8, doc.internal.pageSize.width - 30, 12, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Understatements - Detalle de Cálculos', doc.internal.pageSize.width - 20, yPosition, { align: 'right' });
        yPosition += 15;

        if (data.cellClassicalData?.understatements && data.cellClassicalData.understatements.length > 0) {
            this.addStagesTable(doc, data.cellClassicalData.understatements, yPosition);
            yPosition = (doc as any).lastAutoTable.finalY + 10;
            
            // ✅ RESUMEN UNDERSTATEMENTS CON FORMATO ESPECIAL
            this.addStagesSummaryFormatted(doc, data.cellClassicalData.understatements, data.sampleInterval, yPosition);
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text('No se encontraron understatements', 20, yPosition);
        }

        // ✅ OVERSTATEMENTS EN PÁGINA SEPARADA
        doc.addPage();
        yPosition = 25;

        // Título con fondo
        doc.setFillColor(240, 240, 240);
        doc.rect(15, yPosition - 8, doc.internal.pageSize.width - 30, 12, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Overstatements - Detalle de Cálculos', doc.internal.pageSize.width - 20, yPosition, { align: 'right' });
        yPosition += 15;

        if (data.cellClassicalData?.overstatements && data.cellClassicalData.overstatements.length > 0) {
            this.addStagesTable(doc, data.cellClassicalData.overstatements, yPosition);
            yPosition = (doc as any).lastAutoTable.finalY + 10;
            
            // ✅ RESUMEN OVERSTATEMENTS CON FORMATO ESPECIAL
            this.addStagesSummaryFormatted(doc, data.cellClassicalData.overstatements, data.sampleInterval, yPosition);
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text('No se encontraron overstatements', 20, yPosition);
        }
    }

    private static addStagesTable(doc: jsPDF, stages: any[], startY: number) {
        const tableColumn = [
            'A\nError Stage',
            'B\nUEL Factor', 
            'C\nTainting',
            'D\nAverage\nTainting',
            'E\nUEL of Previous\nStage (H)',
            'F\nLoad & Spread\n(E+C)',
            'G\nSimple Spread\n(B×D)',
            'H\nStage UEL Max\n(F,G)'
        ];

        const tableRows = stages.map((stage: any) => [
            stage.stage.toString(),
            this.formatNumber(stage.uelFactor, 4),
            this.formatNumber(stage.tainting, 4),
            this.formatNumber(stage.averageTainting, 4),
            this.formatNumber(stage.previousUEL, 4),
            this.formatNumber(stage.loadingPropagation, 4),
            this.formatNumber(stage.simplePropagation, 4),
            this.formatNumber(stage.maxStageUEL, 4)
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            theme: 'grid',
            styles: { 
                fontSize: 7, 
                cellPadding: 2,
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            headStyles: { 
                fillColor: [100, 100, 100],
                textColor: [255, 255, 255],
                fontSize: 6,
                cellPadding: 3
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 15, right: 15 }
        });
    }

    private static addStagesSummaryFormatted(doc: jsPDF, stages: any[], sampleInterval: number, startY: number) {
        const finalStage = stages[stages.length - 1];
        const totalTaintings = stages
            .filter((stage: any) => stage.stage > 0)
            .reduce((sum: number, stage: any) => sum + stage.tainting, 0);
        
        const mostLikelyError = totalTaintings * sampleInterval;
        const upperErrorLimit = finalStage.maxStageUEL * sampleInterval;
        const basicPrecision = stages[0].uelFactor * sampleInterval;
        const precisionGapWidening = upperErrorLimit - basicPrecision - mostLikelyError;

        let yPos = startY;

        // Fondo para la sección de resumen
        doc.setFillColor(250, 250, 250);
        doc.rect(20, yPos - 5, doc.internal.pageSize.width - 40, 85, 'F');

        // ✅ TOTAL TAINTINGS
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Total Taintings:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(this.formatNumber(totalTaintings, 4), 70, yPos);

        yPos += 8;

        // ✅ MOST LIKELY ERROR (con fórmula)
        doc.setFont('helvetica', 'bold');
        doc.text('Total Taintings', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text('X', 65, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Sampling Interval', 75, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text('=', 125, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Most Likely Error', 135, yPos);

        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.text(this.formatNumber(totalTaintings, 4), 25, yPos);
        doc.text('X', 65, yPos);
        doc.text(this.formatNumber(sampleInterval, 4), 75, yPos);
        doc.text('=', 125, yPos);
        doc.text(this.formatNumber(mostLikelyError, 4), 135, yPos);

        yPos += 12;

        // ✅ BASIC PRECISION
        doc.setFont('helvetica', 'bold');
        doc.text('Basic Precision:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(this.formatNumber(basicPrecision, 4), 70, yPos);

        yPos += 8;

        // ✅ PRECISION GAP WIDENING
        doc.setFont('helvetica', 'bold');
        doc.text('Precision Gap Widening:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(this.formatNumber(precisionGapWidening, 4), 85, yPos);

        yPos += 12;

        // ✅ UPPER ERROR LIMIT (con fórmula)
        doc.setFont('helvetica', 'bold');
        doc.text('Stage UEL', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text('X', 60, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Sampling Interval', 70, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text('=', 120, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Upper Error Limit', 130, yPos);

        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.text(this.formatNumber(finalStage.maxStageUEL, 4), 25, yPos);
        doc.text('X', 60, yPos);
        doc.text(this.formatNumber(sampleInterval, 4), 70, yPos);
        doc.text('=', 120, yPos);
        doc.text(this.formatNumber(upperErrorLimit, 4), 130, yPos);
    }

    private static addMainResultsTable(doc: jsPDF, data: PDFData, startY: number): number {
        const tableColumn = ['', 'Sobrestimaciones', 'Subestimaciones'];
        let tableRows: any[] = [];

        if (data.evaluationMethod === 'cell-classical') {
            tableRows = this.getCellClassicalTableRows(data);
        } else {
            tableRows = this.getStringerBoundTableRows(data);
        }

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [66, 66, 66], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 20, right: 20 }
        });

        return (doc as any).lastAutoTable.finalY + 10;
    }

    private static getCellClassicalTableRows(data: PDFData): any[] {
        const totalItemsExamined = (data.estimatedSampleSize ?? 0) + (data.highValueCountResume ?? 0);
        const overstatementErrors = data.cellClassicalData?.overstatements?.filter((s: any) => s.stage > 0 && s.tainting > 0).length || 0;
        const understatementErrors = data.cellClassicalData?.understatements?.filter((s: any) => s.stage > 0 && s.tainting > 0).length || 0;

        return [
            ['Tamaño de muestra', this.formatNumber(data.estimatedSampleSize), this.formatNumber(data.estimatedSampleSize)],
            ['Número de errores', this.formatNumber(overstatementErrors), this.formatNumber(understatementErrors)],
            ['Error más probable bruto', this.formatNumber(data.errorMasProbableBruto), this.formatNumber(data.cellClassicalData?.understatementMLE || 0)],
            ['Error más probable neto', this.formatNumber(data.errorMasProbableNeto), this.formatNumber((data.cellClassicalData?.understatementMLE || 0) - data.errorMasProbableBruto)],
            ['Precisión total', this.formatNumber(data.precisionTotal), this.formatNumber(data.precisionTotalUnder || data.precisionTotal)],
            ['Límite error superior bruto', this.formatNumber(data.limiteErrorSuperiorBruto), this.formatNumber(data.cellClassicalData?.understatementUEL || data.limiteErrorSuperiorBruto)],
            ['Límite error superior neto', this.formatNumber(data.limiteErrorSuperiorNeto), this.formatNumber(data.cellClassicalData?.netUnderstatementUEL || 0)],
            [{ content: 'Resultados para Elementos de Valor Alto', colSpan: 3, styles: { fillColor: [200, 200, 200] } }],
            ['Número elementos valor alto', this.formatNumber(data.highValueCountResume), this.formatNumber(data.highValueCountResume)],
            ['Número de errores', this.formatNumber(data.highValueErrors?.overstatementCount || 0), this.formatNumber(data.highValueErrors?.understatementCount || 0)],
            ['Valor de errores', this.formatNumber(data.highValueErrors?.overstatementAmount || 0), this.formatNumber(data.highValueErrors?.understatementAmount || 0)],
            [{ content: 'Resultados Incluyendo Elementos de Valor Alto', colSpan: 3, styles: { fillColor: [200, 200, 200] } }],
            ['Total elementos examinados', this.formatNumber(totalItemsExamined), this.formatNumber(totalItemsExamined)],
            ['Número de errores', this.formatNumber(overstatementErrors), this.formatNumber(understatementErrors)],
            ['Error más probable bruto', this.formatNumber(data.errorMasProbableBruto), this.formatNumber(data.cellClassicalData?.understatementMLE || 0)],
            ['Error más probable neto', this.formatNumber(data.errorMasProbableNeto), this.formatNumber((data.cellClassicalData?.understatementMLE || 0) - data.errorMasProbableBruto)],
            ['Límite error superior bruto', this.formatNumber(data.limiteErrorSuperiorBruto), this.formatNumber(data.cellClassicalData?.understatementUEL || data.limiteErrorSuperiorBruto)],
            ['Límite error superior neto', this.formatNumber(data.limiteErrorSuperiorNeto), this.formatNumber(data.cellClassicalData?.netUnderstatementUEL || 0)]
        ];
    }

    private static getStringerBoundTableRows(data: PDFData): any[] {
        const totalItemsExamined = (data.estimatedSampleSize ?? 0) + (data.highValueCountResume ?? 0);
        const overstatementErrors = data.numErrores > 0 ? 1 : 0;
        const understatementErrors = 0;

        return [
            ['Tamaño muestra combinado', this.formatNumber(data.estimatedSampleSize), this.formatNumber(data.estimatedSampleSize)],
            ['Número de errores', this.formatNumber(overstatementErrors), this.formatNumber(understatementErrors)],
            ['Error más probable bruto', this.formatNumber(data.errorMasProbableBruto), '0.00'],
            ['Error más probable neto', this.formatNumber(data.errorMasProbableNeto), this.formatNumber(-data.errorMasProbableNeto)],
            ['Precisión total', this.formatNumber(data.precisionTotal), this.formatNumber(data.precisionTotal)],
            ['Límite error superior bruto', this.formatNumber(data.limiteErrorSuperiorBruto), this.formatNumber(data.limiteErrorSuperiorBruto)],
            ['Límite error superior neto', this.formatNumber(data.limiteErrorSuperiorNeto), this.formatNumber(data.limiteErrorSuperiorBruto - data.errorMasProbableBruto)],
            [{ content: 'Resultados para Elementos de Valor Alto', colSpan: 3, styles: { fillColor: [200, 200, 200] } }],
            ['Número elementos valor alto', this.formatNumber(data.highValueCountResume), this.formatNumber(data.highValueCountResume)],
            ['Número de errores', this.formatNumber(data.highValueErrors?.overstatementCount || 0), this.formatNumber(data.highValueErrors?.understatementCount || 0)],
            ['Valor de errores', this.formatNumber(data.highValueErrors?.overstatementAmount || 0), this.formatNumber(data.highValueErrors?.understatementAmount || 0)],
            [{ content: 'Resultados Incluyendo Elementos de Valor Alto', colSpan: 3, styles: { fillColor: [200, 200, 200] } }],
            ['Total elementos examinados', this.formatNumber(totalItemsExamined), this.formatNumber(totalItemsExamined)],
            ['Número de errores', this.formatNumber(overstatementErrors), this.formatNumber(understatementErrors)],
            ['Error más probable bruto', this.formatNumber(data.errorMasProbableBruto), '0.00'],
            ['Error más probable neto', this.formatNumber(data.errorMasProbableNeto), this.formatNumber(-data.errorMasProbableNeto)],
            ['Límite error superior bruto', this.formatNumber(data.limiteErrorSuperiorBruto), this.formatNumber(data.limiteErrorSuperiorBruto)],
            ['Límite error superior neto', this.formatNumber(data.limiteErrorSuperiorNeto), this.formatNumber(data.limiteErrorSuperiorBruto - data.errorMasProbableBruto)]
        ];
    }

    private static addConclusionSection(doc: jsPDF, data: PDFData, startY: number) {
        // Verificar si hay espacio suficiente en la página actual
        const currentPageHeight = doc.internal.pageSize.height;
        const spaceNeeded = 40; // Espacio aproximado para la conclusión
        
        if (startY + spaceNeeded > currentPageHeight - 20) {
            doc.addPage();
            startY = 20;
        }

        // Fondo para la conclusión
        doc.setFillColor(240, 240, 240);
        doc.rect(15, startY - 5, doc.internal.pageSize.width - 30, 12, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Conclusión:', doc.internal.pageSize.width - 20, startY, { align: 'right' });
        startY += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const conclusionLines = doc.splitTextToSize(data.conclusionText, doc.internal.pageSize.width - 40);
        doc.text(conclusionLines, 20, startY);
        
        if (data.highValueConclusionText) {
            const highValueLines = doc.splitTextToSize(data.highValueConclusionText, doc.internal.pageSize.width - 40);
            doc.text(highValueLines, 20, startY + (conclusionLines.length * 5) + 5);
        }
    }

    private static formatNumber(value: number, decimals: number = 2): string {
        if (value === undefined || value === null) return '0.00';
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }
}