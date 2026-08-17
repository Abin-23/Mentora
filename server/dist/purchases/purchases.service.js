"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto = __importStar(require("crypto"));
let PurchasesService = class PurchasesService {
    prisma;
    razorpay;
    constructor(prisma) {
        this.prisma = prisma;
        this.razorpay = new razorpay_1.default({
            key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
        });
    }
    async createOrder(userId, courseId) {
        const course = await this.prisma.course.findUnique({
            where: { course_id: courseId },
        });
        if (!course) {
            throw new common_1.BadRequestException('Course not found');
        }
        const price = Number(course.price);
        if (price <= 0) {
            throw new common_1.BadRequestException('Course is free. Use direct enrollment.');
        }
        try {
            const options = {
                amount: Math.round(price * 100),
                currency: 'INR',
                receipt: `receipt_course_${courseId}_user_${userId}`,
            };
            const order = await this.razorpay.orders.create(options);
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
        }
        catch (error) {
            console.error(error);
            throw new common_1.InternalServerErrorException('Error creating payment order');
        }
    }
    async verifyPayment(userId, razorpayOrderId, razorpayPaymentId, signature) {
        const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(razorpayOrderId + '|' + razorpayPaymentId)
            .digest('hex');
        if (generatedSignature !== signature) {
            await this.prisma.purchase.updateMany({
                where: { gateway_order_id: razorpayOrderId },
                data: { status: 'FAILED' },
            });
            throw new common_1.BadRequestException('Payment verification failed');
        }
        const purchase = await this.prisma.purchase.findUnique({
            where: { gateway_order_id: razorpayOrderId },
        });
        if (!purchase) {
            throw new common_1.BadRequestException('Purchase record not found');
        }
        await this.prisma.purchase.update({
            where: { purchase_id: purchase.purchase_id },
            data: {
                gateway_payment_id: razorpayPaymentId,
                gateway_signature: signature,
                status: 'PAID',
                purchased_at: new Date(),
            },
        });
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
    async mockPayment(userId, courseId) {
        const course = await this.prisma.course.findUnique({
            where: { course_id: courseId },
        });
        if (!course) {
            throw new common_1.BadRequestException('Course not found');
        }
        const price = Number(course.price);
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
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map