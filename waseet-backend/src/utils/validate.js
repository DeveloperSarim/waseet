// Zod body-validation middleware. On failure -> 422 with field errors.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return res.status(422).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION',
        details: result.error.flatten().fieldErrors,
      },
    })
  }
  req.body = result.data
  next()
}
