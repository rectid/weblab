import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'

@Controller()
export class RootController {
  @Get('/')
  redirectRoot(@Res() res: Response) {
    // Redirect to frontend dev server if available, otherwise to /stocks
    const frontend = 'http://localhost:5173'
    return res.redirect(frontend)
  }
}
