/**
 * Help Center Articles
 * 
 * Multilingual help articles organized by category.
 * Each article has an id, category, title, content, and tags for search.
 */

export type ArticleCategory = 
  | 'moncash-plus' 
  | 'prism-opt-in' 
  | 'kyc-documents' 
  | 'fees' 
  | 'delivery-times' 
  | 'tracking'
  | 'general';

export interface HelpArticle {
  id: string;
  category: ArticleCategory;
  tags: string[];
  es: {
    title: string;
    content: string;
  };
  ht: {
    title: string;
    content: string;
  };
  fr: {
    title: string;
    content: string;
  };
}

export const helpArticles: HelpArticle[] = [
  {
    id: 'moncash-upgrade-1',
    category: 'moncash-plus',
    tags: ['moncash', 'upgrade', 'billetera', 'wallet'],
    es: {
      title: 'Cómo hacer upgrade a MonCash Plus',
      content: `
# Upgrade a MonCash Plus

Para recibir remesas directamente en tu billetera MonCash, necesitas tener una cuenta **MonCash Plus**.

## Pasos para el upgrade:

1. Abre la app **MonCash** en tu teléfono
2. Ve a **Configuración** → **Upgrade a MonCash Plus**
3. Verifica tu identidad con cédula o pasaporte
4. Completa el proceso de verificación
5. Espera confirmación (generalmente toma 24-48 horas)

## ¿Por qué necesito MonCash Plus?

MonCash Plus te permite recibir remesas directamente en tu billetera digital sin necesidad de retirar en efectivo. Es más rápido, seguro y conveniente.

## Costo

El upgrade a MonCash Plus es **GRATUITO**.

## Apoyo

Si tienes problemas con el upgrade, contacta a MonCash en ***#123#** o visita su oficina más cercana.
      `.trim(),
    },
    ht: {
      title: 'Kijan pou fè upgrade a MonCash Plus',
      content: `
# Upgrade a MonCash Plus

Pou resevwa remès dirèkteman nan bous MonCash ou, ou bezwen gen yon kont **MonCash Plus**.

## Pa pou fè upgrade:

1. Louvri app **MonCash** nan telefòn ou
2. Ale nan **Konfigirasyon** → **Upgrade a MonCash Plus**
3. Verifye idantite ou ak cedila oswa paspò
4. Ranpli pwosesis verifye a
5. Tann konfimasyon (generalman pran 24-48 èdtan)

## Poukisa mwen bezwen MonCash Plus?

MonCash Plus pèmèt ou resevwa remès dirèkteman nan bous dijital ou san ou pa bezwen retire nan lajan kach. Li pi rapid, sekirite ak konvenyan.

## Pri

Upgrade a MonCash Plus **GRATIS**.

## Sipò

Si ou gen pwoblèm ak upgrade a, kontakte MonCash nan ***#123#** oswa vizite biwo yo ki pi pre ou.
      `.trim(),
    },
    fr: {
      title: 'Comment effectuer l\'upgrade vers MonCash Plus',
      content: `
# Upgrade vers MonCash Plus

Pour recevoir des transferts directement dans votre portefeuille MonCash, vous devez avoir un compte **MonCash Plus**.

## Étapes pour l'upgrade:

1. Ouvrez l'app **MonCash** sur votre téléphone
2. Allez à **Paramètres** → **Upgrade vers MonCash Plus**
3. Vérifiez votre identité avec une pièce d'identité ou un passeport
4. Complétez le processus de vérification
5. Attendez la confirmation (généralement 24-48 heures)

## Pourquoi ai-je besoin de MonCash Plus?

MonCash Plus vous permet de recevoir des transferts directement dans votre portefeuille numérique sans avoir besoin de retirer en espèces. C'est plus rapide, sécurisé et pratique.

## Coût

L'upgrade vers MonCash Plus est **GRATUIT**.

## Support

Si vous avez des problèmes avec l'upgrade, contactez MonCash au ***#123#** ou visitez leur bureau le plus proche.
      `.trim(),
    },
  },
  {
    id: 'prism-authorize-1',
    category: 'prism-opt-in',
    tags: ['prism', 'autorizar', 'opt-in', 'remesas externas'],
    es: {
      title: 'Qué es PRISM y cómo autorizarlo',
      content: `
# Autorizar PRISM para Remesas Externas

**PRISM** (Programa de Remesas Internacionales Seguras de MonCash) es el sistema que permite que remesas externas ingresen directamente a tu billetera MonCash Plus.

## ¿Qué es PRISM?

PRISM es una autorización opcional que le indica a MonCash que puedes recibir remesas de orígenes externos (como kobcash) directamente en tu billetera, sin necesidad de ir a una sucursal.

## Cómo autorizar PRISM:

1. Abre la app **MonCash Plus**
2. Ve a **Configuración** → **Remesas**
3. Busca la opción "Autorizar Remesas Externas (PRISM)"
4. Activa el toggle
5. Confirma con tu PIN o huella dactilar

## Ventajas de PRISM:

✅ **Más rápido**: Recibes el dinero en segundos  
✅ **Más seguro**: No necesitas transportar efectivo  
✅ **24/7**: Funciona en cualquier momento  
✅ **Sin comisiones adicionales**

## Importante:

Solo funciona si tienes MonCash Plus activado. Si aún no has hecho el upgrade, hazlo primero.

## Desactivar PRISM:

Si en algún momento quieres desactivar PRISM, puedes hacerlo desde la misma sección de Configuración.
      `.trim(),
    },
    ht: {
      title: 'Kisa PRISM ye e kijan pou otorize li',
      content: `
# Otorize PRISM pou Remès Ekstèn

**PRISM** (Pwogram Remès Entènasyonal MonCash Sekirite) se sistèm ki pèmèt remès ekstèn antre dirèkteman nan bous MonCash Plus ou.

## Kisa PRISM ye?

PRISM se yon otorizasyon opsyonèl ki fè MonCash konnen ou ka resevwa remès ki soti nan lòt kote (tankou kobcash) dirèkteman nan bous ou, san ou pa bezwen ale nan yon biwo.

## Kijan pou otorize PRISM:

1. Louvri app **MonCash Plus**
2. Ale nan **Konfigirasyon** → **Remès**
3. Chèche opsyon "Otorize Remès Ekstèn (PRISM)"
4. Aktive switch la
5. Konfime ak PIN ou oswa emprent

## Avantaj PRISM:

✅ **Pi rapid**: Ou resevwa lajan an nan segonn  
✅ **Pi sekirite**: Ou pa bezwen transpòte lajan kach  
✅ **24/7**: Fòme nan nenpòt moman  
✅ **San komisyon adisyonèl**

## Enpòtan:

Li sèlman fonksyone si ou gen MonCash Plus aktive. Si ou poko fè upgrade a, fè l anvan.

## Dezaktyve PRISM:

Si nan nenpòt moman ou vle dezaktive PRISM, ou ka fè l nan menm seksyon Konfigirasyon an.
      `.trim(),
    },
    fr: {
      title: 'Qu\'est-ce que PRISM et comment l\'autoriser',
      content: `
# Autoriser PRISM pour les transferts externes

**PRISM** (Programme de Transferts Internationaux Sûrs de MonCash) est le système qui permet aux transferts externes d'entrer directement dans votre portefeuille MonCash Plus.

## Qu'est-ce que PRISM?

PRISM est une autorisation optionnelle qui indique à MonCash que vous pouvez recevoir des transferts d'origine externe (comme kobcash) directement dans votre portefeuille, sans avoir besoin d'aller dans une succursale.

## Comment autoriser PRISM:

1. Ouvrez l'app **MonCash Plus**
2. Allez à **Paramètres** → **Transferts**
3. Recherchez l'option "Autoriser les Transferts Externes (PRISM)"
4. Activez le commutateur
5. Confirmez avec votre PIN ou empreinte digitale

## Avantages de PRISM:

✅ **Plus rapide**: Vous recevez l'argent en quelques secondes  
✅ **Plus sûr**: Pas besoin de transporter des espèces  
✅ **24/7**: Fonctionne à tout moment  
✅ **Sans frais supplémentaires**

## Important:

Cela ne fonctionne que si vous avez activé MonCash Plus. Si vous n'avez pas encore fait l'upgrade, faites-le d'abord.

## Désactiver PRISM:

Si vous souhaitez désactiver PRISM à tout moment, vous pouvez le faire depuis la même section Paramètres.
      `.trim(),
    },
  },
  {
    id: 'kyc-docs-1',
    category: 'kyc-documents',
    tags: ['kyc', 'verificacion', 'documentos', 'cedula'],
    es: {
      title: 'Documentos necesarios para verificación KYC',
      content: `
# Documentos para Verificación KYC

**KYC** (Know Your Customer - Conoce a tu Cliente) es el proceso de verificación de identidad requerido por ley.

## Documentos aceptados:

### Para residentes dominicanos:
- ✅ **Cédula dominicana** (original o copia certificada)
- ✅ **Licencia de conducir** dominicana

### Para no residentes:
- ✅ **Pasaporte** válido
- ✅ **Cédula de identidad** del país de origen

## Proceso de verificación:

1. **Registro**: Crea tu cuenta en kobcash
2. **Subir documentos**: Toma una foto clara de tu documento
3. **Selfie**: Toma una foto tuya sosteniendo tu documento
4. **Revisión**: Nuestro equipo revisa en 1-2 días hábiles
5. **Aprobación**: Recibirás notificación por email/SMS

## Consejos para fotos claras:

📸 **Buenas condiciones**:
- Buena iluminación
- Enfocado y nítido
- Sin sombras o reflejos
- Todo el documento visible

❌ **Evita**:
- Fotos borrosas
- Documentos dañados
- Iluminación pobre
- Dedos cubriendo información

## ¿Cuánto tiempo tarda?

- **Revisión**: 1-2 días hábiles
- **Aprobación**: Notificación inmediata
- **Actividación**: Automática al aprobarse

## Problemas comunes:

**"Mi documento fue rechazado"**  
→ Verifica que la foto sea clara y legible

**"Tarda demasiado"**  
→ Contacta soporte si pasan más de 3 días

**"No tengo documento"**  
→ Solicita cita con oficina de migración
      `.trim(),
    },
    ht: {
      title: 'Dokiman nesesè pou verifye KYC',
      content: `
# Dokiman pou Verifye KYC

**KYC** (Know Your Customer - Konnen Kliyan Ou) se pwosesis verifikasyon idantite obligatwa pa lwa.

## Dokiman aksepte:

### Pou moun ki rete nan Dominikani:
- ✅ **Sedila dominikèn** (orijinal oswa kopi sètifye)
- ✅ **Lisans kondwi** dominikèn

### Pou moun ki pa rezidan:
- ✅ **Paspò** valab
- ✅ **Sedila idantite** nan peyi orijin li

## Pwosesis verifye:

1. **Enskripsyon**: Kreye kont ou nan kobcash
2. **Moute dokiman**: Pran yon foto klè nan dokiman ou
3. **Selfie**: Pran yon foto ou kenbe dokiman ou an
4. **Revize**: Ekip nou an revize nan 1-2 jou ouvrab
5. **Aprobe**: Ou ap resevwa notifikasyon nan imèl/SMS

## Konsèy pou foto klè:

📸 **Bon kondisyon**:
- Bon limyè
- Fòk li klè ak nèt
- San lonbraj oswa refleksyon
- Tout dokiman vizib

❌ **Evite**:
- Foto flou
- Dokiman domaje
- Limyè pòv
- Dwèt ki kouvri enfòmasyon

## Konbyen tan li pran?

- **Revize**: 1-2 jou ouvrab
- **Aprobe**: Notifikasyon imedyat
- **Aktive**: Otomatik lè li apwouve

## Pwoblèm komen:

**"Dokiman mwen an te rejte"**  
→ Verifye foto a klè e li.

**"Li pran twò lontan"**  
→ Kontakte sipò si pase plis pase 3 jou

**"Mwen pa gen dokiman"**  
→ Mande yon randevou nan biwo imigrasyon
      `.trim(),
    },
    fr: {
      title: 'Documents nécessaires pour la vérification KYC',
      content: `
# Documents pour la Vérification KYC

**KYC** (Know Your Customer - Connaître votre Client) est le processus de vérification d'identité requis par la loi.

## Documents acceptés:

### Pour les résidents dominicains:
- ✅ **Carte d'identité dominicaine** (originale ou copie certifiée)
- ✅ **Permis de conduire** dominicain

### Pour les non-résidents:
- ✅ **Passeport** valide
- ✅ **Carte d'identité** du pays d'origine

## Processus de vérification:

1. **Inscription**: Créez votre compte sur kobcash
2. **Télécharger documents**: Prenez une photo claire de votre document
3. **Selfie**: Prenez une photo de vous tenant votre document
4. **Révision**: Notre équipe révise en 1-2 jours ouvrables
5. **Approbation**: Vous recevrez une notification par email/SMS

## Conseils pour des photos claires:

📸 **Bonnes conditions**:
- Bon éclairage
- Nette et nette
- Sans ombres ni reflets
- Tout le document visible

❌ **Évitez**:
- Photos floues
- Documents endommagés
- Éclairage faible
- Doigts couvrant des informations

## Combien de temps cela prend-il?

- **Révision**: 1-2 jours ouvrables
- **Approbation**: Notification immédiate
- **Activation**: Automatique une fois approuvé

## Problèmes courants:

**"Mon document a été rejeté"**  
→ Vérifiez que la photo soit claire et lisible

**"Cela prend trop de temps"**  
→ Contactez le support si cela prend plus de 3 jours

**"Je n'ai pas de document"**  
→ Demandez un rendez-vous au bureau d'immigration
      `.trim(),
    },
  },
  {
    id: 'fees-explained-1',
    category: 'fees',
    tags: ['tarifas', 'comisiones', 'costos', 'gastos'],
    es: {
      title: 'Cómo funcionan las tarifas y comisiones',
      content: `
# Tarifas y Comisiones Explicadas

Comprender cómo se calculan las tarifas te ayuda a tomar decisiones informadas.

## Estructura de Tarifas:

### 1. Comisión de kobcash
- **Fija**: $RD 50
- **Porcentual**: 2% del monto
- **Ejemplo**: Para $RD 5,000 → $RD 50 + $RD 100 = **$RD 150**

### 2. Tarifa Gubernamental (BRH - Haití)
- **Fija**: **US$ 1.50** por remesa
- Convertida a DOP según tasa del día
- Ejemplo: ~$RD 82-85

### 3. Tasa de Cambio
- Calculada en **tiempo real**
- Incluye spread de mercado
- Basada en tasas oficiales

## Ejemplo Completo:

**Envías**: $RD 5,000

**Desglose**:
- Monto principal: $RD 5,000.00
- Comisión kobcash: $RD 150.00
- Tarifa BRH (US$1.50): $RD 82.50
- **Total pagas**: $RD 5,232.50

**Recibe** (ejemplo con tasa 1 DOP = 2.5 HTG):
- HTG recibido: **12,250 HTG**

## Preguntas Frecuentes:

**¿Por qué pagar comisiones?**  
→ Cubren costos de operación, compliance, y seguros

**¿La tarifa BRH es obligatoria?**  
→ Sí, es una tarifa oficial del Banco Central de Haití

**¿Cómo obtener mejor tasa?**  
→ Nuestras tasas son competitivas y se actualizan en tiempo real

**¿Hay tarifas ocultas?**  
→ No, todo es transparente antes de confirmar
      `.trim(),
    },
    ht: {
      title: 'Kijan tarif ak komisyon fonksyone',
      content: `
# Tarif ak Komisyon Eksplike

Konprann kijan yo kalkile tarif yo ede ou pran desizyon enfòme.

## Estrikti Tarif:

### 1. Komisyon kobcash
- **Fiks**: $RD 50
- **Pousantaj**: 2% nan montan
- **Egzanp**: Pou $RD 5,000 → $RD 50 + $RD 100 = **$RD 150**

### 2. Tarif Gouvènmantal (BRH - Ayiti)
- **Fiks**: **US$ 1.50** pou chak remès
- Konvèti an DOP selon to nan jou a
- Egzanp: ~$RD 82-85

### 3. To Chanj
- Kalkile nan **tan reyèl**
- Gen ladan spread mache
- Baze sou to ofisyèl

## Egzanp Konplè:

**Ou voye**: $RD 5,000

**Detay**:
- Montan prensipal: $RD 5,000.00
- Komisyon kobcash: $RD 150.00
- Tarif BRH (US$1.50): $RD 82.50
- **Total ou peye**: $RD 5,232.50

**Resevwa** (egzanp ak to 1 DOP = 2.5 HTG):
- HTG resevwa: **12,250 HTG**

## Kesyon Komen:

**Poukisa peye komisyon?**  
→ Yo kouvri depans operasyon, konfòmite, ak asirans

**Tarif BRH obligatwa?**  
→ Wi, se yon tarif ofisyèl nan Bank Santral Ayiti

**Kijan pou jwenn pi bon to?**  
→ To nou yo konpetitif ak mete ajou nan tan reyèl

**Gen tarif kache?**  
→ Non, tout bagay transparan anvan ou konfime
      `.trim(),
    },
    fr: {
      title: 'Comment fonctionnent les tarifs et commissions',
      content: `
# Tarifs et Commissions Expliqués

Comprendre comment les tarifs sont calculés vous aide à prendre des décisions éclairées.

## Structure des Tarifs:

### 1. Commission kobcash
- **Fixe**: $RD 50
- **Pourcentage**: 2% du montant
- **Exemple**: Pour $RD 5,000 → $RD 50 + $RD 100 = **$RD 150**

### 2. Tarif Gouvernemental (BRH - Haïti)
- **Fixe**: **US$ 1.50** par transfert
- Converti en DOP selon le taux du jour
- Exemple: ~$RD 82-85

### 3. Taux de Change
- Calculé en **temps réel**
- Inclut le spread de marché
- Basé sur des taux officiels

## Exemple Complet:

**Vous envoyez**: $RD 5,000

**Détail**:
- Montant principal: $RD 5,000.00
- Commission kobcash: $RD 150.00
- Tarif BRH (US$1.50): $RD 82.50
- **Total payé**: $RD 5,232.50

**Reçu** (exemple avec taux 1 DOP = 2.5 HTG):
- HTG reçu: **12,250 HTG**

## Questions Fréquentes:

**Pourquoi payer des commissions?**  
→ Elles couvrent les coûts d'exploitation, conformité et assurances

**Le tarif BRH est-il obligatoire?**  
→ Oui, c'est un tarif officiel de la Banque Centrale d'Haïti

**Comment obtenir un meilleur taux?**  
→ Nos taux sont compétitifs et mis à jour en temps réel

**Y a-t-il des frais cachés?**  
→ Non, tout est transparent avant de confirmer
      `.trim(),
    },
  },
  {
    id: 'delivery-times-1',
    category: 'delivery-times',
    tags: ['tiempos', 'entrega', 'cuanto tarda', 'velocidad'],
    es: {
      title: '¿Cuánto tarda en llegar mi remesa?',
      content: `
# Tiempos de Entrega

Cada canal tiene diferentes tiempos de procesamiento.

## MonCash Plus (Depósito Digital)

**Tiempo**: ⚡ **Instantáneo** (segundos)
- El beneficiario recibe el dinero directamente en su billetera
- Disponible 24/7
- Requiere MonCash Plus + PRISM activado

## SPIH (Retiro en Banco/Sucursal)

**Tiempo**: 📅 **15-60 minutos**
- El beneficiario debe ir a una sucursal autorizada
- Horarios: Lunes a Sábado 8:00 AM - 6:00 PM
- Requiere presentar identificación

## Timeline Detallado:

### MonCash Plus:
1. Confirmar remesa: 1-2 minutos
2. Procesar pago: 2-5 minutos
3. **Entrega**: 0 segundos (instantáneo)
4. **TOTAL**: 3-7 minutos

### SPIH:
1. Confirmar remesa: 1-2 minutos
2. Procesar pago: 2-5 minutos
3. Preparar en sucursal: 10-30 minutos
4. Disponible para retiro: 15-60 minutos
5. **TOTAL**: 15-90 minutos

## Factores que afectan tiempos:

⚠️ **Verificaciones pendientes**: + 1-2 días  
⚠️ **Feriados**: + 1 día  
⚠️ **Problemas de red**: + 1-2 horas  
⚠️ **Revisión por fraude**: + 1 día

## Recomendaciones:

✅ **MonCash Plus**: Ideal para urgencias  
✅ **SPIH**: Si prefieres retiro en efectivo  
✅ **Evita feriados**: Planifica con anticipación

## Problemas?

Si tu remesa tarda más de lo esperado:
1. Verifica el código de tracking
2. Revisa notificaciones
3. Contacta soporte
      `.trim(),
    },
    ht: {
      title: 'Konbyen tan remès la pran pou rive?',
      content: `
# Tan Livrezon

Chak kanal gen tan trete diferan.

## MonCash Plus (Depo Dijital)

**Tan**: ⚡ **Imediat** (segonn)
- Benefisyè a resevwa lajan an dirèkteman nan bous li
- Disponib 24/7
- Oblije gen MonCash Plus + PRISM aktive

## SPIH (Retrè nan Bank/Biwo)

**Tan**: 📅 **15-60 minit**
- Benefisyè a dwe ale nan yon biwo otorize
- Orè: Lendi a Samdi 8:00 AM - 6:00 PM
- Oblije prezante idantifikasyon

## Konplè Tan:

### MonCash Plus:
1. Konfime remès: 1-2 minit
2. Trete peman: 2-5 minit
3. **Livrezon**: 0 segonn (imedyat)
4. **TOTAL**: 3-7 minit

### SPIH:
1. Konfime remès: 1-2 minit
2. Trete peman: 2-5 minit
3. Prepare nan biwo: 10-30 minit
4. Disponib pou retrè: 15-60 minit
5. **TOTAL**: 15-90 minit

## Faktè ki afekte tan yo:

⚠️ **Verifye an atant**: + 1-2 jou  
⚠️ **Jou ferye**: + 1 jou  
⚠️ **Pwoblèm rezo**: + 1-2 èdtan  
⚠️ **Revize pou fo**: + 1 jou

## Rekòmandasyon:

✅ **MonCash Plus**: Ideal pou ijans  
✅ **SPIH**: Si ou prefere retrè lajan kach  
✅ **Evite jou ferye**: Planifye nan avans

## Pwoblèm?

Si remès ou an pran plis pase atann:
1. Verifye kòd suiv la
2. Revize notifikasyon yo
3. Kontakte sipò
      `.trim(),
    },
    fr: {
      title: 'Combien de temps prend mon transfert?',
      content: `
# Délais de Livraison

Chaque canal a des temps de traitement différents.

## MonCash Plus (Dépôt Numérique)

**Temps**: ⚡ **Instantané** (secondes)
- Le bénéficiaire reçoit l'argent directement dans son portefeuille
- Disponible 24/7
- Nécessite MonCash Plus + PRISM activé

## SPIH (Retrait en Banque/Succursale)

**Temps**: 📅 **15-60 minutes**
- Le bénéficiaire doit se rendre dans une succursale autorisée
- Horaires: Lundi à Samedi 8h00 - 18h00
- Nécessite présenter une pièce d'identité

## Calendrier Détaillé:

### MonCash Plus:
1. Confirmer transfert: 1-2 minutes
2. Traiter paiement: 2-5 minutes
3. **Livraison**: 0 seconde (instantané)
4. **TOTAL**: 3-7 minutes

### SPIH:
1. Confirmer transfert: 1-2 minutes
2. Traiter paiement: 2-5 minutes
3. Préparer en succursale: 10-30 minutes
4. Disponible pour retrait: 15-60 minutes
5. **TOTAL**: 15-90 minutes

## Facteurs affectant les délais:

⚠️ **Vérifications en attente**: + 1-2 jours  
⚠️ **Jours fériés**: + 1 jour  
⚠️ **Problèmes réseau**: + 1-2 heures  
⚠️ **Révision pour fraude**: + 1 jour

## Recommandations:

✅ **MonCash Plus**: Idéal pour les urgences  
✅ **SPIH**: Si vous préférez le retrait en espèces  
✅ **Éviter les jours fériés**: Planifiez à l'avance

## Problèmes?

Si votre transfert prend plus de temps que prévu:
1. Vérifiez le code de suivi
2. Consultez les notifications
3. Contactez le support
      `.trim(),
    },
  },
  {
    id: 'tracking-guide-1',
    category: 'tracking',
    tags: ['seguimiento', 'rastreo', 'codigo', 'buscar'],
    es: {
      title: 'Cómo rastrear mi remesa',
      content: `
# Rastrear tu Remesa

Sigue el estado de tu remesa en tiempo real con tu código de referencia.

## ¿Qué es el código de referencia?

Es un código único que recibes cuando creas una remesa.  
Formato: **REM-XXXXX-XXXX**

## Cómo rastrear:

### Opción 1: Desde la web
1. Ve a la página [Rastrear](/track)
2. Ingresa tu código de referencia
3. Click en "Buscar"
4. Revisa la línea de tiempo

### Opción 2: Desde tu cuenta
1. Inicia sesión
2. Ve a [Mis Transacciones](/transactions)
3. Busca tu remesa
4. Click en "Ver Detalles"

## Estados de Remesa:

### 📝 CREATED
Remesa creada, esperando cotización

### 💰 QUOTED
Cotización generada, listo para confirmar

### ✅ CONFIRMED
Remesa confirmada y pagada

### 📤 SENT
Enviado a red de pago (MonCash/SPIH)

### 🎉 PAID
Beneficiario ya recibió el dinero

### ❌ FAILED
Error en el proceso

### 🔄 REFUNDED
Remesa reembolsada

## Notificaciones:

Recibirás notificaciones por:
- 📧 **Email**
- 💬 **SMS**
- 📱 **WhatsApp** (opcional)

## Compartir estado:

Puedes compartir el link de rastreo con:
- Beneficiario
- Familia
- Cualquier persona con el código

## Problemas de rastreo:

**"No encuentro mi código"**  
→ Revisa tu email o SMS de confirmación

**"Estado no cambia"**  
→ Algunos estados pueden tardar minutos en actualizar

**"Código inválido"**  
→ Verifica que ingresaste el código correcto
      `.trim(),
    },
    ht: {
      title: 'Kijan pou suiv remès mwen an',
      content: `
# Swiv Remès Ou

Swiv estati remès ou an nan tan reyèl ak kòd referans ou.

## Kisa kòd referans ye?

Se yon kòd inik ou resevwa lè ou kreye yon remès.  
Fòma: **REM-XXXXX-XXXX**

## Kijan pou swiv:

### Opsyon 1: Depi entènèt
1. Ale nan paj [Swiv](/track)
2. Antre kòd referans ou
3. Klik sou "Chèche"
4. Revize liy tan yo

### Opsyon 2: Depi kont ou
1. Konekte
2. Ale nan [Tranzaksyon Mwen](/transactions)
3. Chèche remès ou
4. Klik sou "Wè Detay"

## Estati Remès:

### 📝 CREATED
Remès kreye, ap tann kotasyon

### 💰 QUOTED
Kotasyon jenere, pare pou konfime

### ✅ CONFIRMED
Remès konfime epi peye

### 📤 SENT
Voye nan rezo peman (MonCash/SPIH)

### 🎉 PAID
Benefisyè deja resevwa lajan an

### ❌ FAILED
Erè nan pwosesis la

### 🔄 REFUNDED
Remès rembouse

## Notifikasyon:

Ou ap resevwa notifikasyon pa:
- 📧 **Imèl**
- 💬 **SMS**
- 📱 **WhatsApp** (opsyonèl)

## Pataje estati:

Ou ka pataje lyen swiv lan ak:
- Benefisyè
- Fanmi
- Nenpòt moun ki gen kòd la

## Pwoblèm swiv:

**"Mwen pa jwenn kòd mwen"**  
→ Revize imèl ou oswa SMS konfimasyon

**"Estati pa chanje"**  
→ Kèk estati ka pran minit pou mete ajou

**"Kòd envali"**  
→ Verifye ou antre kòd ki kòrèk
      `.trim(),
    },
    fr: {
      title: 'Comment suivre mon transfert',
      content: `
# Suivre votre Transfert

Suivez le statut de votre transfert en temps réel avec votre code de référence.

## Qu'est-ce que le code de référence?

C'est un code unique que vous recevez lorsque vous créez un transfert.  
Format: **REM-XXXXX-XXXX**

## Comment suivre:

### Option 1: Depuis le web
1. Allez à la page [Suivre](/track)
2. Entrez votre code de référence
3. Cliquez sur "Rechercher"
4. Consultez la chronologie

### Option 2: Depuis votre compte
1. Connectez-vous
2. Allez à [Mes Transactions](/transactions)
3. Recherchez votre transfert
4. Cliquez sur "Voir Détails"

## Statuts de Transfert:

### 📝 CREATED
Transfert créé, en attente de devis

### 💰 QUOTED
Devis généré, prêt à confirmer

### ✅ CONFIRMED
Transfert confirmé et payé

### 📤 SENT
Envoyé au réseau de paiement (MonCash/SPIH)

### 🎉 PAID
Le bénéficiaire a reçu l'argent

### ❌ FAILED
Erreur dans le processus

### 🔄 REFUNDED
Transfert remboursé

## Notifications:

Vous recevrez des notifications par:
- 📧 **Email**
- 💬 **SMS**
- 📱 **WhatsApp** (optionnel)

## Partager le statut:

Vous pouvez partager le lien de suivi avec:
- Le bénéficiaire
- La famille
- Toute personne avec le code

## Problèmes de suivi:

**"Je ne trouve pas mon code"**  
→ Consultez votre email ou SMS de confirmation

**"Le statut ne change pas"**  
→ Certains statuts peuvent prendre des minutes à mettre à jour

**"Code invalide"**  
→ Vérifiez que vous avez entré le bon code
      `.trim(),
    },
  },
  {
    id: 'getting-started-1',
    category: 'general',
    tags: ['inicio', 'primeros pasos', 'como empezar'],
    es: {
      title: 'Primeros pasos en kobcash',
      content: `
# Bienvenido a kobcash

Guía rápida para empezar a enviar remesas.

## 1. Crear tu cuenta

Regístrate con:
- Email válido
- Nombre completo
- Número de teléfono
- Contraseña segura (mínimo 8 caracteres)

## 2. Verificar tu identidad (KYC)

Sube tus documentos:
- Foto de cédula/pasaporte
- Selfie con documento
- Espera aprobación (1-2 días)

## 3. Añadir fondos

Los agentes aceptan:
- 💵 Efectivo
- 🏦 Transferencia bancaria
- 💳 Tarjeta de débito/crédito

## 4. Enviar tu primera remesa

1. Ve a [Crear Remesa](/remittances/create)
2. Ingresa datos del beneficiario
3. Revisa cotización
4. Confirma y paga
5. Comparte código de tracking

## Conceptos importantes:

### Monto mínimo
**$RD 100** por transacción

### Monto máximo
**$RD 1,000,000** por día (depende de tu verificación)

### Canales disponibles
- **MonCash Plus**: Instantáneo (requiere upgrade)
- **SPIH**: 15-60 minutos (retiro en sucursal)

## Tips de seguridad:

✅ Usa contraseña fuerte  
✅ No compartas tu código de referencia  
✅ Verifica siempre el beneficiario  
✅ Reporta transacciones sospechosas

## Soporte:

📞 **Teléfono**: +1 (809) XXX-XXXX  
📧 **Email**: soporte@kobcash.com  
💬 **Chat**: Disponible en app  
🌐 **Ayuda**: [/help](/help)

¡Listo para empezar!
      `.trim(),
    },
    ht: {
      title: 'Premye pa nan kobcash',
      content: `
# Byenveni nan kobcash

Gid rapid pou kòmanse voye remès.

## 1. Kreye kont ou

Enskri ak:
- Imèl valab
- Non konplè
- Nimewo telefòn
- Mo de pas sekirite (minimum 8 karaktè)

## 2. Verifye idantite ou (KYC)

Moute dokiman ou yo:
- Foto cedila/paspò
- Selfie ak dokiman
- Tann apwobasyon (1-2 jou)

## 3. Ajoute lajan

Ajan yo aksepte:
- 💵 Lajan kach
- 🏦 Transfè bankè
- 💳 Kat debi/kredi

## 4. Voye premye remès ou

1. Ale nan [Kreye Remès](/remittances/create)
2. Antre done benefisyè
3. Revize kotasyon
4. Konfime epi peye
5. Pataje kòd swiv

## Konsèp enpòtan:

### Montan minimòm
**$RD 100** pou chak tranzaksyon

### Montan maksimòm
**$RD 1,000,000** pou chak jou (depann sou verifye ou)

### Kanal disponib
- **MonCash Plus**: Imedyat (bezwen upgrade)
- **SPIH**: 15-60 minit (retrè nan biwo)

## Konsèy sekirite:

✅ Itilize mo de pas fò  
✅ Pa pataje kòd referans ou  
✅ Verifye tout tan benefisyè a  
✅ Rapòte tranzaksyon sispèk

## Sipò:

📞 **Telefòn**: +1 (809) XXX-XXXX  
📧 **Imèl**: sipò@kobcash.com  
💬 **Chat**: Disponib nan app  
🌐 **Èd**: [/help](/help)

Pare pou kòmanse!
      `.trim(),
    },
    fr: {
      title: 'Premiers pas sur kobcash',
      content: `
# Bienvenue sur kobcash

Guide rapide pour commencer à envoyer des transferts.

## 1. Créer votre compte

Inscrivez-vous avec:
- Email valide
- Nom complet
- Numéro de téléphone
- Mot de passe sécurisé (minimum 8 caractères)

## 2. Vérifier votre identité (KYC)

Téléchargez vos documents:
- Photo de pièce d'identité/passeport
- Selfie avec document
- Attendez l'approbation (1-2 jours)

## 3. Ajouter des fonds

Les agents acceptent:
- 💵 Espèces
- 🏦 Transfert bancaire
- 💳 Carte de débit/crédit

## 4. Envoyer votre premier transfert

1. Allez à [Créer Transfert](/remittances/create)
2. Entrez les données du bénéficiaire
3. Consultez le devis
4. Confirmez et payez
5. Partagez le code de suivi

## Concepts importants:

### Montant minimum
**$RD 100** par transaction

### Montant maximum
**$RD 1,000,000** par jour (dépend de votre vérification)

### Canaux disponibles
- **MonCash Plus**: Instantané (nécessite upgrade)
- **SPIH**: 15-60 minutes (retrait en succursale)

## Conseils de sécurité:

✅ Utilisez un mot de passe fort  
✅ Ne partagez pas votre code de référence  
✅ Vérifiez toujours le bénéficiaire  
✅ Signalez les transactions suspectes

## Support:

📞 **Téléphone**: +1 (809) XXX-XXXX  
📧 **Email**: support@kobcash.com  
💬 **Chat**: Disponible dans l'app  
🌐 **Aide**: [/help](/help)

Prêt à commencer!
      `.trim(),
    },
  },
];

// Helper functions
export function getArticlesByCategory(category: ArticleCategory): HelpArticle[] {
  return helpArticles.filter(article => article.category === category);
}

export function getArticleById(id: string): HelpArticle | undefined {
  return helpArticles.find(article => article.id === id);
}

export function searchArticles(query: string, locale: 'es' | 'ht' | 'fr'): HelpArticle[] {
  const lowerQuery = query.toLowerCase();
  return helpArticles.filter(article => {
    const content = article[locale];
    return (
      content.title.toLowerCase().includes(lowerQuery) ||
      content.content.toLowerCase().includes(lowerQuery) ||
      article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  });
}

export function getCategoryLabel(category: ArticleCategory, locale: 'es' | 'ht' | 'fr'): string {
  const labels = {
    es: {
      'moncash-plus': 'MonCash Plus',
      'prism-opt-in': 'PRISM Opt-in',
      'kyc-documents': 'Documentos KYC',
      'fees': 'Tarifas y Comisiones',
      'delivery-times': 'Tiempos de Entrega',
      'tracking': 'Rastreo',
      'general': 'General',
    },
    ht: {
      'moncash-plus': 'MonCash Plus',
      'prism-opt-in': 'PRISM Opt-in',
      'kyc-documents': 'Dokiman KYC',
      'fees': 'Tarif ak Komisyon',
      'delivery-times': 'Tan Livrezon',
      'tracking': 'Swiv',
      'general': 'Jeneral',
    },
    fr: {
      'moncash-plus': 'MonCash Plus',
      'prism-opt-in': 'PRISM Opt-in',
      'kyc-documents': 'Documents KYC',
      'fees': 'Tarifs et Commissions',
      'delivery-times': 'Délais de Livraison',
      'tracking': 'Suivi',
      'general': 'Général',
    },
  };
  return labels[locale][category] || category;
}

