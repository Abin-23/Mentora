import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PurchasesService {
  private razorpay: any;

  constructor(private prisma: PrismaService) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });
  }

  async createOrder(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { course_id: courseId },
    });
    if (!course) {
      throw new BadRequestException('Course not found');
    }

    const price = Number(course.price);

    if (price <= 0) {
      throw new BadRequestException('Course is free. Use direct enrollment.');
    }

    try {
      const options = {
        amount: Math.round(price * 100), // amount in the smallest currency unit
        currency: 'INR',
        receipt: `receipt_course_${courseId}_user_${userId}`,
      };

      const order = await this.razorpay.orders.create(options);

      // Create purchase record in DB
      const purchase = await this.prisma.purchase.create({
        data: {
          user_id: userId,
          course_id: courseId,
          amount: price,
          currency: 'INR',
          payment_gateway: 'Razorpay',
          gateway_order_id: order.id,
          status: 'PENDING',
        },
      });

      return {
        orderId: order.id,
        amount: options.amount,
        currency: options.currency,
        purchaseId: purchase.purchase_id,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error creating payment order');
    }
  }

  async verifyPayment(
    userId: number,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
  ) {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    if (generatedSignature !== signature) {
      // Update purchase status if it exists
      await this.prisma.purchase.updateMany({
        where: { gateway_order_id: razorpayOrderId },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException('Payment verification failed');
    }

    const purchase = await this.prisma.purchase.findUnique({
      where: { gateway_order_id: razorpayOrderId },
    });

    if (!purchase) {
      throw new BadRequestException('Purchase record not found');
    }

    // Update purchase to PAID
    await this.prisma.purchase.update({
      where: { purchase_id: purchase.purchase_id },
      data: {
        gateway_payment_id: razorpayPaymentId,
        gateway_signature: signature,
        status: 'PAID',
        purchased_at: new Date(),
      },
    });

    // Create enrollment
    await this.prisma.enrollment.create({
      data: {
        user_id: purchase.user_id,
        course_id: purchase.course_id,
        purchase_id: purchase.purchase_id,
        enrollment_status: 'ACTIVE',
      },
    });

    return {
      success: true,
      message: 'Payment verified successfully and enrolled',
    };
  }

  async mockPayment(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { course_id: courseId },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    const price = Number(course.price);

    // Create a mock purchase
    const purchase = await this.prisma.purchase.create({
      data: {
        user_id: userId,
        course_id: courseId,
        amount: price,
        currency: 'INR',
        payment_gateway: 'Mentora_Direct',
        gateway_order_id: `mock_order_${Date.now()}`,
        gateway_payment_id: `mock_pay_${Date.now()}`,
        status: 'PAID',
        purchased_at: new Date(),
      },
    });

    // Create enrollment
    await this.prisma.enrollment.create({
      data: {
        user_id: userId,
        course_id: courseId,
        purchase_id: purchase.purchase_id,
        enrollment_status: 'ACTIVE',
      },
    });

    return {
      success: true,
      message: 'Mock payment successful and enrolled',
    };
  }
}
