import { object, string, email, minLength, regex, pipe, number, minValue } from 'valibot'

export const guestFormSchema = object({
  name: pipe(
    string(),
    minLength(2, 'Name is required')
  ),
  email: pipe(
    string(),
    email('Enter a valid email')
  ),
  phoneNumber: pipe(
    number(),
    minValue(1000000000, 'Enter a valid 10-digit phone number')
  ),
  gender: pipe(
    string(),
    regex(/^(M|F|O)$/, 'Gender must be M, F, or O')
  )
})
export const otpSchema = object({
  email: pipe(
    string(),
    email('Enter a valid email')
  ),
    otp: pipe(
        string(),
        minLength(6, 'OTP is required'),
        regex(/^\d{6}$/, 'OTP must be a 6-digit number')
    )
})
