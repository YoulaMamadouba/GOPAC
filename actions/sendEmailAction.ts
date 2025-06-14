
'use server';

import nodemailer from 'nodemailer';

// Interface pour les options d'e-mail
interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Configuration du transporteur Nodemailer (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Fonction pour envoyer un e-mail
export async function sendEmailAction(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    await transporter.sendMail({
      from: `"Système de Gestion des Demandes" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });
    return { success: true };
  } catch (error: any) {
    console.error(`Erreur lors de l'envoi de l'e-mail à ${options.to}:`, error);
    return { success: false, error: 'Impossible d\'envoyer l\'e-mail' };
  }
}