export type Language = 'es' | 'ht' | 'fr';

export const translations = {
  es: {
    // Auth
    login: 'Iniciar Sesión',
    signup: 'Crear Cuenta',
    logout: 'Salir',
    email: 'Correo electrónico',
    password: 'Contraseña',
    fullName: 'Nombre completo',
    phone: 'Teléfono',
    
    // Dashboard
    welcome: 'Bienvenido',
    dashboard: 'Panel de Control',
    newRemittance: 'Nueva Remesa',
    myTransactions: 'Mis Transacciones',
    agentManagement: 'Gestión de Agentes',
    reports: 'Reportes',
    
    // Roles
    admin: 'Administrador',
    agent: 'Agente',
    sender: 'Emisor',
    compliance: 'Oficial de Cumplimiento',
    agentOwner: 'Propietario de Tienda',
    agentClerk: 'Empleado de Tienda',
    
    // Transactions
    reference: 'Referencia',
    amount: 'Monto',
    recipient: 'Beneficiario',
    status: 'Estado',
    date: 'Fecha',
    commission: 'Comisión',
    exchangeRate: 'Tasa de Cambio',
    
    // Status
    pending: 'Pendiente',
    completed: 'Completada',
    cancelled: 'Cancelada',
    processing: 'En Proceso',
    
    // Actions
    create: 'Crear',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    export: 'Exportar',
    filter: 'Filtrar',
    search: 'Buscar',
    
    // Store
    storeName: 'Nombre de Tienda',
    address: 'Dirección',
    availableFloat: 'Float Disponible',
    active: 'Activa',
    inactive: 'Inactiva',
    
    // Messages
    loading: 'Cargando...',
    noData: 'No hay datos disponibles',
    error: 'Error',
    success: 'Éxito',
    confirmDelete: '¿Está seguro de eliminar?',
  },
  ht: {
    // Auth
    login: 'Konekte',
    signup: 'Kreye Kont',
    logout: 'Dekonekte',
    email: 'Imèl',
    password: 'Mo de Pas',
    fullName: 'Non Konplè',
    phone: 'Telefòn',
    
    // Dashboard
    welcome: 'Byenveni',
    dashboard: 'Tablo Kontròl',
    newRemittance: 'Nouvo Remès',
    myTransactions: 'Tranzaksyon Mwen',
    agentManagement: 'Jesyon Ajan',
    reports: 'Rapò',
    
    // Roles
    admin: 'Administratè',
    agent: 'Ajan',
    sender: 'Moun k ap Voye',
    compliance: 'Ofisyè Konfòmite',
    agentOwner: 'Pwopriyetè Magazen',
    agentClerk: 'Anplwaye Magazen',
    
    // Transactions
    reference: 'Referans',
    amount: 'Montan',
    recipient: 'Moun k ap Resevwa',
    status: 'Estati',
    date: 'Dat',
    commission: 'Komisyon',
    exchangeRate: 'To Chanj',
    
    // Status
    pending: 'An Atant',
    completed: 'Konplete',
    cancelled: 'Anile',
    processing: 'Ap Trete',
    
    // Actions
    create: 'Kreye',
    edit: 'Modifye',
    delete: 'Efase',
    save: 'Anrejistre',
    cancel: 'Anile',
    export: 'Ekspòte',
    filter: 'Filtre',
    search: 'Chèche',
    
    // Store
    storeName: 'Non Magazen',
    address: 'Adrès',
    availableFloat: 'Lajan Disponib',
    active: 'Aktif',
    inactive: 'Inaktif',
    
    // Messages
    loading: 'Ap Chaje...',
    noData: 'Pa gen done',
    error: 'Erè',
    success: 'Siksè',
    confirmDelete: 'Èske w sèten pou efase?',
  },
  fr: {
    // Auth
    login: 'Se Connecter',
    signup: 'Créer un Compte',
    logout: 'Déconnexion',
    email: 'Email',
    password: 'Mot de Passe',
    fullName: 'Nom Complet',
    phone: 'Téléphone',
    
    // Dashboard
    welcome: 'Bienvenue',
    dashboard: 'Tableau de Bord',
    newRemittance: 'Nouvelle Remise',
    myTransactions: 'Mes Transactions',
    agentManagement: 'Gestion des Agents',
    reports: 'Rapports',
    
    // Roles
    admin: 'Administrateur',
    agent: 'Agent',
    sender: 'Émetteur',
    compliance: 'Agent de Conformité',
    agentOwner: 'Propriétaire de Magasin',
    agentClerk: 'Employé de Magasin',
    
    // Transactions
    reference: 'Référence',
    amount: 'Montant',
    recipient: 'Bénéficiaire',
    status: 'Statut',
    date: 'Date',
    commission: 'Commission',
    exchangeRate: 'Taux de Change',
    
    // Status
    pending: 'En Attente',
    completed: 'Terminée',
    cancelled: 'Annulée',
    processing: 'En Cours',
    
    // Actions
    create: 'Créer',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    export: 'Exporter',
    filter: 'Filtrer',
    search: 'Rechercher',
    
    // Store
    storeName: 'Nom du Magasin',
    address: 'Adresse',
    availableFloat: 'Solde Disponible',
    active: 'Active',
    inactive: 'Inactive',
    
    // Messages
    loading: 'Chargement...',
    noData: 'Aucune donnée disponible',
    error: 'Erreur',
    success: 'Succès',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer?',
  },
};

export function useTranslation(lang: Language = 'es') {
  const t = (key: keyof typeof translations.es): string => {
    return translations[lang][key] || translations.es[key] || key;
  };

  return { t, lang };
}
