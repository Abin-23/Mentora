import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create-order')
  createOrder(@Req() req: any, @Body('courseId') courseId: number) {
    return this.purchasesService.createOrder(req.user.user_id, courseId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('verify-payment')
  verifyPayment(
    @Req() req: any,
    @Body('razorpay_order_id') razorpayOrderId: string,
    @Body('razorpay_payment_id') razorpayPaymentId: string,
    @Body('razorpay_signature') razorpaySignature: string,
  ) {
    return this.purchasesService.verifyPayment(
      req.user.user_id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
  }
}
