/**
 * Notification Templates
 * 
 * Bilingual templates (ES/HT/FR) for different events
 */

export type Language = 'es' | 'ht' | 'fr';
export type EventType = 'ORDER_CREATED' | 'PAYMENT_CONFIRMED' | 'PAYOUT_SENT' | 'PAYOUT_SETTLED' | 'OTP_SENT';

export interface NotificationTemplate {
  subject: string;
  body: string;
  sms: string;
  whatsapp?: string;
}

const templates: Record<EventType, Record<Language, NotificationTemplate>> = {
  ORDER_CREATED: {
    es: {
      subject: 'Remesa Creada - Código: {code}',
      body: `
Estimado/a {name},

Tu remesa ha sido creada exitosamente.

📋 Detalles:
• Código de referencia: {code}
• Monto enviado: {principal_dop} DOP
• Beneficiario: {beneficiary}
• Canal: {channel}

Gracias por confiar en kobcash.

Ver tracking: {tracking_url}
      `.trim(),
      sms: 'Remesa creada: {code}. Envias {principal_dop} DOP → {beneficiary}. Rastrea: {tracking_url}',
      whatsapp: '✅ Remesa creada exitosamente\n\n📋 Código: {code}\n💵 Monto: {principal_dop} DOP\n👤 Beneficiario: {beneficiary}\n📍 Canal: {channel}\n\n🔗 Rastrea: {tracking_url}'
    },
    ht: {
      subject: 'Remès Kreye - Kòd: {code}',
      body: `
Mesyè/Madam {name},

Remès ou a kreye avèk siksè.

📋 Detay:
• Kòd referans: {code}
• Kantite voye: {principal_dop} DOP
• Benefisye: {beneficiary}
• Chanèl: {channel}

Mèsi paske w fè konfyans nan kobcash.

Gade tracking: {tracking_url}
      `.trim(),
      sms: 'Remès kreye: {code}. Ou voye {principal_dop} DOP → {beneficiary}. Tracke: {tracking_url}',
      whatsapp: '✅ Remès kreye avèk siksè\n\n📋 Kòd: {code}\n💵 Kantite: {principal_dop} DOP\n👤 Benefisye: {beneficiary}\n📍 Chanèl: {channel}\n\n🔗 Tracke: {tracking_url}'
    },
    fr: {
      subject: 'Virement Créé - Code: {code}',
      body: `
Cher/Chère {name},

Votre virement a été créé avec succès.

📋 Détails:
• Code de référence: {code}
• Montant envoyé: {principal_dop} DOP
• Bénéficiaire: {beneficiary}
• Canal: {channel}

Merci de faire confiance à kobcash.

Suivi: {tracking_url}
      `.trim(),
      sms: 'Virement créé: {code}. Envoyez {principal_dop} DOP → {beneficiary}. Suivre: {tracking_url}',
      whatsapp: '✅ Virement créé avec succès\n\n📋 Code: {code}\n💵 Montant: {principal_dop} DOP\n👤 Bénéficiaire: {beneficiary}\n📍 Canal: {channel}\n\n🔗 Suivre: {tracking_url}'
    }
  },
  PAYMENT_CONFIRMED: {
    es: {
      subject: 'Pago Confirmado - Remesa: {code}',
      body: `
Estimado/a {name},

¡Tu pago ha sido confirmado!

✅ Remesa {code}
💵 Monto pagado: {total_paid} DOP
📞 Beneficiario recibirá: {amount_htg} HTG

Tu remesa está siendo procesada.

Ver tracking: {tracking_url}
      `.trim(),
      sms: '✅ Pago confirmado: {code}. Beneficiario recibirá {amount_htg} HTG. Track: {tracking_url}',
      whatsapp: '✅ ¡Pago Confirmado!\n\n📋 Remesa: {code}\n💵 Pagado: {total_paid} DOP\n🎁 Beneficiario recibirá: {amount_htg} HTG\n\n🔗 Track: {tracking_url}'
    },
    ht: {
      subject: 'Peman Konfime - Remès: {code}',
      body: `
Mesyè/Madam {name},

Peman ou a konfime!

✅ Remès {code}
💵 Montan peye: {total_paid} DOP
📞 Benefisye a ap resevwa: {amount_htg} HTG

Remès ou a ap trete.

Gade tracking: {tracking_url}
      `.trim(),
      sms: '✅ Peman konfime: {code}. Benefisye a ap resevwa {amount_htg} HTG. Track: {tracking_url}',
      whatsapp: '✅ Peman Konfime!\n\n📋 Remès: {code}\n💵 Peye: {total_paid} DOP\n🎁 Benefisye a ap resevwa: {amount_htg} HTG\n\n🔗 Track: {tracking_url}'
    },
    fr: {
      subject: 'Paiement Confirmé - Virement: {code}',
      body: `
Cher/Chère {name},

Votre paiement a été confirmé!

✅ Virement {code}
💵 Montant payé: {total_paid} DOP
📞 Bénéficiaire recevra: {amount_htg} HTG

Votre virement est en cours de traitement.

Suivi: {tracking_url}
      `.trim(),
      sms: '✅ Paiement confirmé: {code}. Bénéficiaire recevra {amount_htg} HTG. Suivre: {tracking_url}',
      whatsapp: '✅ Paiement Confirmé!\n\n📋 Virement: {code}\n💵 Payé: {total_paid} DOP\n🎁 Bénéficiaire recevra: {amount_htg} HTG\n\n🔗 Suivre: {tracking_url}'
    }
  },
  PAYOUT_SENT: {
    es: {
      subject: 'Remesa Enviada - Código: {code}',
      body: `
Estimado/a {name},

Tu remesa ha sido enviada al partner.

✅ Remesa {code}
💵 Monto enviado: {amount_htg} HTG
📞 Beneficiario: {beneficiary}
📍 Canal: {channel}

El beneficiario puede retirar ahora.

Ver tracking: {tracking_url}
      `.trim(),
      sms: '✅ Remesa enviada: {code}. Retira {amount_htg} HTG en {channel}. Track: {tracking_url}',
      whatsapp: '✅ Remesa Enviada!\n\n📋 Código: {code}\n💵 Monto: {amount_htg} HTG\n📞 Beneficiario: {beneficiary}\n📍 Canal: {channel}\n\n🔗 Track: {tracking_url}'
    },
    ht: {
      subject: 'Remès Voye - Kòd: {code}',
      body: `
Mesyè/Madam {name},

Remès ou a voye bay patnè a.

✅ Remès {code}
💵 Montan voye: {amount_htg} HTG
📞 Benefisye: {beneficiary}
📍 Chanèl: {channel}

Benefisye a ka retire kounye a.

Gade tracking: {tracking_url}
      `.trim(),
      sms: '✅ Remès voye: {code}. Retire {amount_htg} HTG nan {channel}. Track: {tracking_url}',
      whatsapp: '✅ Remès Voye!\n\n📋 Kòd: {code}\n💵 Montan: {amount_htg} HTG\n📞 Benefisye: {beneficiary}\n📍 Chanèl: {channel}\n\n🔗 Track: {tracking_url}'
    },
    fr: {
      subject: 'Virement Envoyé - Code: {code}',
      body: `
Cher/Chère {name},

Votre virement a été envoyé au partenaire.

✅ Virement {code}
💵 Montant envoyé: {amount_htg} HTG
📞 Bénéficiaire: {beneficiary}
📍 Canal: {channel}

Le bénéficiaire peut retirer maintenant.

Suivi: {tracking_url}
      `.trim(),
      sms: '✅ Virement envoyé: {code}. Retirer {amount_htg} HTG sur {channel}. Suivre: {tracking_url}',
      whatsapp: '✅ Virement Envoyé!\n\n📋 Code: {code}\n💵 Montant: {amount_htg} HTG\n📞 Bénéficiaire: {beneficiary}\n📍 Canal: {channel}\n\n🔗 Suivre: {tracking_url}'
    }
  },
  PAYOUT_SETTLED: {
    es: {
      subject: 'Remesa Liquidada - Código: {code}',
      body: `
Estimado/a {name},

¡Tu remesa ha sido liquidada completamente!

✅ Remesa {code}
💵 Monto enviado: {amount_htg} HTG
📞 Beneficiario: {beneficiary}

La transacción está completa.

Ver tracking: {tracking_url}
      `.trim(),
      sms: '✅ Remesa liquidada: {code}. Transacción completa. Track: {tracking_url}',
      whatsapp: '✅ ¡Remesa Liquidada!\n\n📋 Código: {code}\n💵 Monto: {amount_htg} HTG\n📞 Beneficiario: {beneficiary}\n\n🎉 Transacción completa!\n\n🔗 Track: {tracking_url}'
    },
    ht: {
      subject: 'Remès Likidasyon - Kòd: {code}',
      body: `
Mesyè/Madam {name},

Remès ou a likidasyon nèt!

✅ Remès {code}
💵 Montan voye: {amount_htg} HTG
📞 Benefisye: {beneficiary}

Tranzaksyon an fini.

Gade tracking: {tracking_url}
      `.trim(),
      sms: '✅ Remès likidasyon: {code}. Tranzaksyon fini. Track: {tracking_url}',
      whatsapp: '✅ Remès Likidasyon!\n\n📋 Kòd: {code}\n💵 Montan: {amount_htg} HTG\n📞 Benefisye: {beneficiary}\n\n🎉 Tranzaksyon fini!\n\n🔗 Track: {tracking_url}'
    },
    fr: {
      subject: 'Virement Liquidé - Code: {code}',
      body: `
Cher/Chère {name},

Votre virement a été liquidé complètement!

✅ Virement {code}
💵 Montant envoyé: {amount_htg} HTG
📞 Bénéficiaire: {beneficiary}

La transaction est complète.

Suivi: {tracking_url}
      `.trim(),
      sms: '✅ Virement liquidé: {code}. Transaction complète. Suivre: {tracking_url}',
      whatsapp: '✅ Virement Liquidé!\n\n📋 Code: {code}\n💵 Montant: {amount_htg} HTG\n📞 Bénéficiaire: {beneficiary}\n\n🎉 Transaction complète!\n\n🔗 Suivre: {tracking_url}'
    }
  },
  OTP_SENT: {
    es: {
      subject: 'Código de Verificación - kobcash',
      body: `
Estimado/a {name},

Tu código de verificación es: {code}

Este código expira en {expiry}.

Si no solicitaste este código, ignora este mensaje.

kobcash - Transferencias seguras
      `.trim(),
      sms: 'kobcash: Tu código es {code}. Válido por {expiry}',
      whatsapp: '🔐 kobcash\n\nTu código de verificación:\n📌 {code}\n\n⏰ Válido por {expiry}\n\nSi no solicitaste esto, ignora este mensaje.'
    },
    ht: {
      subject: 'Kòd Verifikasyon - kobcash',
      body: `
Mesyè/Madam {name},

Kòd verifikasyon ou se: {code}

Kòd sa a expire nan {expiry}.

Si ou pa mande kòd sa a, inyore mesaj sa a.

kobcash - Transfè sekirite
      `.trim(),
      sms: 'kobcash: Kòd ou se {code}. Valab pou {expiry}',
      whatsapp: '🔐 kobcash\n\nKòd verifikasyon ou:\n📌 {code}\n\n⏰ Valab pou {expiry}\n\nSi ou pa mande sa, inyore mesaj sa a.'
    },
    fr: {
      subject: 'Code de Vérification - kobcash',
      body: `
Cher/Chère {name},

Votre code de vérification est: {code}

Ce code expire dans {expiry}.

Si vous n'avez pas demandé ce code, ignorez ce message.

kobcash - Transferts sécurisés
      `.trim(),
      sms: 'kobcash: Votre code est {code}. Valable pour {expiry}',
      whatsapp: '🔐 kobcash\n\nVotre code de vérification:\n📌 {code}\n\n⏰ Valable pour {expiry}\n\nSi vous n\'avez pas demandé ceci, ignorez ce message.'
    }
  }
};

export function getTemplate(event: EventType, lang: Language = 'es'): NotificationTemplate {
  return templates[event][lang];
}

export function interpolateTemplate(template: NotificationTemplate, variables: Record<string, string | number>): NotificationTemplate {
  const interpolate = (str: string) => {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key]?.toString() || match;
    });
  };

  return {
    subject: interpolate(template.subject),
    body: interpolate(template.body),
    sms: interpolate(template.sms),
    whatsapp: template.whatsapp ? interpolate(template.whatsapp) : undefined
  };
}

