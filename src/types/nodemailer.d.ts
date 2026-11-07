declare module "nodemailer" {
  interface SendMailResult { messageId?: string; }
  interface Transporter {
    sendMail: (mail: Record<string, unknown>) => Promise<SendMailResult>;
  }
  interface NodemailerModule {
    createTransport: (...args: unknown[]) => Transporter;
  }
  const nodemailer: NodemailerModule;
  export default nodemailer;
}
