const { Resend } = require('resend');

const resend = new Resend('re_SzTAVaer_BMsdGxeue12L48ovbJnvHJiv');

async function addSender() {
  try {
    const data = await resend.senders.create({
      email: 'mamadoubayoula240@gmail.com',
      name: 'MamadouBa Youla', // Nom affiché dans les emails
    });
    console.log('Expéditeur ajouté avec succès :', data);
  } catch (error) {
    console.error('Erreur lors de l’ajout de l’expéditeur :', error);
  }
}

addSender();