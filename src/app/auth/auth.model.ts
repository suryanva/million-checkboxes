import { email, z } from 'zod'


export const registrationPayloadModel = z.object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(6)
})


export const LoginPayloadModel = z.object({
    email: z.email(),
    password: z.string().min(6)
})