interface EmailSentInfoProps {
  email: string
}

export function EmailSentInfo({ email }: EmailSentInfoProps) {
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3")

  return (
    <div className="text-center mb-6">
      <p className="text-gray-400">We sent a verification code to</p>
      <p className="text-white font-medium">{maskedEmail}</p>
    </div>
  )
}

