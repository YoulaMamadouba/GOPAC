
import { sendEmailAction } from '@/actions/sendEmailAction';

// Interface pour les options d'e-mail
interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Rediriger vers le server action
export async function sendEmail(options: EmailOptions): Promise<void> {
  const result = await sendEmailAction(options);
  if (!result.success) {
    throw new Error(result.error || 'Impossible d\'envoyer l\'e-mail');
  }
}