import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    createOrder(req: any, courseId: number): Promise<{
        orderId: any;
        amount: number;
        currency: string;
        purchaseId: number;
    }>;
    verifyPayment(req: any, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<{
        success: boolean;
        message: string;
    }>;
    mockPayment(req: any, courseId: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
