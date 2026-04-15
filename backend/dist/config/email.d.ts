import nodemailer from "nodemailer";
export declare const initializeEthereal: () => Promise<nodemailer.Transporter<any, nodemailer.TransportOptions>>;
export declare const getTransporter: () => nodemailer.Transporter<any, nodemailer.TransportOptions>;
export declare const getEtherealAccount: () => {
    user: string;
    pass: string;
} | null;
export declare const sendEmail: (to: string, subject: string, body: string, from?: string) => Promise<{
    messageId: any;
    previewUrl: string | false;
}>;
//# sourceMappingURL=email.d.ts.map