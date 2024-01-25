// import { z } from "zod"

// const validateRegistration = z.object({
//     email: z.string(),
//     accountType: z.string(),
//     phoneNumber: z.string(),
//     password: z.string(),
// });

// const validateLogin =  z.object({
//     email: z.string(),
//     password: z.string()
//         .min(8)
// });

// const validateGoogleLogin = z.object({
//     accessToken: z.string(),
// });

// const validateFacebookLogin =  z.object({
//     accessToken: z.string(),
//     userId: z.string()
// });

// const validatePasswordUpdate = z.object({
//     oldPassword: z.string()
//         .min(8).optional(),
//     newPassword: z.string()
//         .min(8)
// });

// const validateAdminPasswordUpdate = z.object({
//     newPassword: z.string().min(8),
//     userId: z.string().uuid(),
//     sendMail: z.boolean().optional()
// });

// const validateProfileUpdate =  z.object({
//     firstName: z.string()
//         .optional(),
//     lastName: z.string()
//         .optional(),
//     dob: z.date()
//         .optional(),
//     phoneNumber: z.string()
//         .optional(),
//     otherPhoneNumber: z.string()
//         .optional(),
//     profileImage: z.string()
//         .optional(),
// })

// const validateAdminUpdateProfileUpdate =  z.object({
//     userId: z.string().trim().uuid(),
//     firstName: z.string()
//         .trim()
//         .optional(),
//     lastName: z.string()
//         .optional(),
//     dob: z.date()
//         .optional(),
//     phoneNumber: z.string()
//         .optional(),
//     otherPhoneNumber: z.string()
//         .optional(),
//     company: z.string()
//         .optional(),
//     approvedForOnlineShopping: z.boolean()
//         .optional(),
//     profileImage: z.string()
//         .optional(),
// })

// const validateVerifyDocumentUpload =  z.object({
//     idType: z.number(),
//     idLink: z.string(),
// })

// const validateFundUserWallet =  z.object({
//     currency: z.string().optional(),
//     userId: z.string(),
//     amount: z.string()
// })

// const validateAddNotification = z.object({
//     userId: z.string(),
//     notification: z.string()
// })

// export {
//     validateRegistration,
//     validateLogin,
//     validatePasswordUpdate,
//     validateProfileUpdate,
//     validateAdminUpdateProfileUpdate,
//     validateFacebookLogin,
//     validateGoogleLogin,
//     validateVerifyDocumentUpload,
//     validateFundUserWallet,
//     validateAdminPasswordUpdate,
//     validateAddNotification
// }
