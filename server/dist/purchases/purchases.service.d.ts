import { PrismaService } from '../prisma/prisma.service';
export declare class PurchasesService {
    private prisma;
    private razorpay;
    constructor(prisma: PrismaService);
    createOrder(userId: number, courseId: number): Promise<{
        orderId: any;
        amount: number;
        currency: string;
        purchaseId: number;
    }>;
    verifyPayment(userId: number, razorpayOrderId: string, razorpayPaymentId: string, signature: string): Promise<{
        success: boolean;
        message: string;
    }>;
    mockPayment(userId: number, courseId: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
