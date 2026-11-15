import type { ExpenseCategory, Language } from './finance';

export const COPY: Record<
  Language,
  {
    appTagline: string;
    langButton: string;
    signOut: string;
    authTitle: string;
    authSubtitle: string;
    signInTab: string;
    signUpTab: string;
    googleSignInBtn: string;
    googleSigningIn: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    signInBtn: string;
    signUpBtn: string;
    orDivider: string;
    demoBtn: string;
    firebaseReadyNote: string;
    authErrors: {
      invalidEmail: string;
      shortPassword: string;
      missingName: string;
      wrongCredentials: string;
      emailTaken: string;
      googleFailed: string;
    };
    availableBalanceTitle: string;
    onBudgetTag: string;
    overBudgetTag: string;
    spentLabel: string;
    budgetLabel: string;
    editBudgetTitle: string;
    saveBudget: string;
    cancel: string;
    invalidBudget: string;
    safeDailyTitle: string;
    daysLeftSuffix: (days: number) => string;
    weeklyGoalTitle: string;
    weeklyGoalAction: string;
    weeklyGoalHint: string;
    quickLogCta: string;
    quickLogLockedCta: string;
    freePlanStatus: (used: number, limit: number) => string;
    proPlanStatus: string;
    upgradeLink: string;
    recentTitle: string;
    recentEmptyTitle: string;
    recentEmptyBody: string;
    deleteExpenseLabel: (merchant: string) => string;
    categories: Record<ExpenseCategory, string>;
    captureTitle: string;
    captureSubtitle: string;
    photoTab: string;
    voiceTab: string;
    textTab: string;
    uploadPhotoTitle: string;
    uploadPhotoHint: string;
    choosePhotoBtn: string;
    changePhotoBtn: string;
    analyzePhotoBtn: string;
    voiceReadyHint: string;
    startRecording: string;
    stopRecording: string;
    recordingNow: string;
    analyzeVoiceBtn: string;
    reRecordBtn: string;
    micUnavailableError: string;
    textInputLabel: string;
    textInputPlaceholder: string;
    analyzeTextBtn: string;
    analyzingLabel: string;
    analyzingSubtitle: string;
    resultTitle: string;
    shareStoriesBtn: string;
    doneBtn: string;
    storiesTitle: string;
    storiesSubtitle: string;
    storiesDownloadBtn: string;
    storiesDownloaded: string;
    storiesMonthlySaved: string;
    storiesLatestRoast: string;
    installApp: string;
    installIOS: string;
    iosModalTitle: string;
    iosModalBody: string;
    offlineBadge: string;
    paywall: {
      kicker: string;
      limitBanner: string;
      title: string;
      subtitle: string;
      benefits: [string, string, string];
      monthlyName: string;
      annualName: string;
      popularTag: string;
      subscribeNowBtn: string;
      checkoutTitle: string;
      checkoutSubtitle: string;
      selectedPlanLabel: string;
      externalCheckoutBtn: string;
      simulateApprovedBtn: string;
      simulatingBtn: string;
      backToPlansBtn: string;
      testNotice: string;
      successTitle: string;
      successSubtitle: string;
      continueCaptureBtn: string;
      backDashboardBtn: string;
      updateError: string;
    };
  }
> = {
  'pt-BR': {
    appTagline: 'Banco inteligente de gastos com IA',
    langButton: 'PT-BR',
    signOut: 'Sair',
    authTitle: 'Seu dinheiro, sem filtro.',
    authSubtitle:
      'Registre recibos por foto ou voz e receba a real da nossa IA sobre seus gastos do mês.',
    signInTab: 'Entrar',
    signUpTab: 'Criar conta',
    googleSignInBtn: 'Entrar com Google',
    googleSigningIn: 'Conectando ao Google…',
    nameLabel: 'Nome',
    namePlaceholder: 'Ex: Marina Silva',
    emailLabel: 'E-mail',
    emailPlaceholder: 'voce@exemplo.com',
    passwordLabel: 'Senha',
    passwordPlaceholder: 'Mínimo 6 caracteres',
    signInBtn: 'Entrar com E-mail',
    signUpBtn: 'Criar conta grátis',
    orDivider: 'ou acesse rápido',
    demoBtn: 'Entrar na conta demo',
    firebaseReadyNote:
      'Login Google sincronizado com Firebase Auth & Firestore.',
    authErrors: {
      invalidEmail: 'Informe um endereço de e-mail válido.',
      shortPassword: 'A senha deve ter pelo menos 6 caracteres.',
      missingName: 'Informe seu nome para criar a conta.',
      wrongCredentials: 'E-mail ou senha incorretos.',
      emailTaken: 'Já existe uma conta cadastrada com este e-mail.',
      googleFailed: 'Não foi possível concluir o login com Google. Tente novamente.',
    },
    availableBalanceTitle: 'Saldo disponível no mês',
    onBudgetTag: 'Orçamento em dia',
    overBudgetTag: 'Acima do teto',
    spentLabel: 'Gasto',
    budgetLabel: 'Teto',
    editBudgetTitle: 'Editar teto mensal',
    saveBudget: 'Salvar teto',
    cancel: 'Cancelar',
    invalidBudget: 'Digite um valor maior que zero.',
    safeDailyTitle: 'Limite seguro hoje',
    daysLeftSuffix: (days) =>
      days === 1 ? '1 dia restante no mês' : `${days} dias restantes no mês`,
    weeklyGoalTitle: 'Meta semanal / Economia',
    weeklyGoalAction: 'Gerar Stories 9:16',
    weeklyGoalHint: 'Reserva semanal sugerida',
    quickLogCta: 'Registro rápido por voz ou foto',
    quickLogLockedCta: 'Desbloquear registros ilimitados',
    freePlanStatus: (used, limit) =>
      `Plano gratuito · ${Math.min(used, limit)}/${limit} gastos grátis`,
    proPlanStatus: 'PaySnap Pro · Lançamentos ilimitados',
    upgradeLink: 'Assinar Pro',
    recentTitle: 'Lançamentos recentes',
    recentEmptyTitle: 'Nenhum gasto registrado ainda',
    recentEmptyBody:
      'Use o botão acima para fotografar um recibo, print de Pix ou falar quanto gastou.',
    deleteExpenseLabel: (merchant) => `Excluir gasto em ${merchant}`,
    categories: {
      food: 'Alimentação',
      transport: 'Transporte',
      leisure: 'Lazer',
      bills: 'Contas',
      other: 'Outros',
    },
    captureTitle: 'Novo lançamento com IA',
    captureSubtitle:
      'Envie foto de cupom/Pix ou grave um áudio rápido. O Gemini extrai tudo na hora.',
    photoTab: 'Foto / Pix',
    voiceTab: 'Voz',
    textTab: 'Texto',
    uploadPhotoTitle: 'Foto do recibo ou print de Pix',
    uploadPhotoHint: 'JPG, PNG ou WebP da câmera ou galeria',
    choosePhotoBtn: 'Tirar foto ou escolher arquivo',
    changePhotoBtn: 'Trocar imagem',
    analyzePhotoBtn: 'Extrair gasto da imagem',
    voiceReadyHint: 'Toque para gravar o que você gastou (ex: "45 reais no café").',
    startRecording: 'Gravar áudio',
    stopRecording: 'Parar gravação',
    recordingNow: 'Gravando… toque para parar',
    analyzeVoiceBtn: 'Enviar áudio para IA',
    reRecordBtn: 'Gravar de novo',
    micUnavailableError:
      'Microfone indisponível neste navegador. Use Foto / Pix ou Texto.',
    textInputLabel: 'Descreva o gasto rapidamente',
    textInputPlaceholder: 'Ex: R$ 64,90 no iFood de madrugada',
    analyzeTextBtn: 'Registrar com IA',
    analyzingLabel: 'Julgando suas escolhas financeiras...',
    analyzingSubtitle: 'Lendo o valor, o estabelecimento e preparando a bronca da IA.',
    resultTitle: 'Gasto registrado!',
    shareStoriesBtn: 'Compartilhar no Stories',
    doneBtn: 'Voltar ao painel',
    storiesTitle: 'Card para Stories (9:16)',
    storiesSubtitle: 'Pronto para postar no Instagram ou TikTok.',
    storiesDownloadBtn: 'Baixar PNG (9:16)',
    storiesDownloaded: 'PNG baixado!',
    storiesMonthlySaved: 'Disponível no mês',
    storiesLatestRoast: 'Última bronca da IA',
    installApp: 'Instalar App',
    installIOS: 'Instalar no iOS',
    iosModalTitle: 'Instalar PaySnap no iPhone',
    iosModalBody:
      'Toque no ícone de Compartilhar na barra do Safari e escolha "Adicionar à Tela de Início".',
    offlineBadge: 'Modo offline — exibindo dados salvos localmente.',
    paywall: {
      kicker: 'PaySnap Pro',
      limitBanner: 'Você atingiu o limite de 3 gastos gratuitos.',
      title: 'Sua carteira precisa de um adulto responsável',
      subtitle:
        'Desbloqueie a IA sem limites para controlar cada Pix, recibo e delivery antes que o mês acabe.',
      benefits: [
        'Lançamentos ilimitados por foto e voz',
        'Broncas personalizadas da IA',
        'Gerador de Stories 9:16 ilimitado',
      ],
      monthlyName: 'Plano Mensal',
      annualName: 'Plano Anual',
      popularTag: 'Mais Popular - Economize 50%',
      subscribeNowBtn: 'Assinar Agora',
      checkoutTitle: 'Checkout PaySnap Pro',
      checkoutSubtitle:
        'Ambiente de teste para validar a ativação do plano Pro no usuário.',
      selectedPlanLabel: 'Plano selecionado',
      externalCheckoutBtn: 'Abrir link de pagamento externo',
      simulateApprovedBtn: 'Simular Pagamento Aprovado',
      simulatingBtn: 'Ativando PaySnap Pro…',
      backToPlansBtn: 'Voltar aos planos',
      testNotice:
        'Ao simular a aprovação, atualizamos is_pro: true diretamente no seu perfil.',
      successTitle: 'PaySnap Pro ativado!',
      successSubtitle:
        'Sua conta agora tem lançamentos ilimitados por foto, voz e Stories 9:16.',
      continueCaptureBtn: 'Registrar novo gasto agora',
      backDashboardBtn: 'Voltar ao painel',
      updateError: 'Não foi possível ativar o plano Pro. Tente novamente.',
    },
  },
  'en-US': {
    appTagline: 'Smart AI personal finance',
    langButton: 'EN-US',
    signOut: 'Sign out',
    authTitle: 'Your money, unfiltered.',
    authSubtitle:
      'Snap receipts or log expenses by voice and get brutally honest AI commentary.',
    signInTab: 'Sign in',
    signUpTab: 'Create account',
    googleSignInBtn: 'Sign in with Google',
    googleSigningIn: 'Connecting to Google…',
    nameLabel: 'Name',
    namePlaceholder: 'e.g., Alex Rivera',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    signInBtn: 'Sign in with Email',
    signUpBtn: 'Create free account',
    orDivider: 'or quick access',
    demoBtn: 'Try Demo Account',
    firebaseReadyNote:
      'Google Sign-In synced with Firebase Auth & Firestore.',
    authErrors: {
      invalidEmail: 'Please enter a valid email address.',
      shortPassword: 'Password must be at least 6 characters.',
      missingName: 'Please enter your name to create an account.',
      wrongCredentials: 'Incorrect email or password.',
      emailTaken: 'An account with this email already exists.',
      googleFailed: 'Could not complete Google Sign-In. Please try again.',
    },
    availableBalanceTitle: 'Available balance this month',
    onBudgetTag: 'On budget',
    overBudgetTag: 'Over budget',
    spentLabel: 'Spent',
    budgetLabel: 'Budget',
    editBudgetTitle: 'Edit monthly budget',
    saveBudget: 'Save budget',
    cancel: 'Cancel',
    invalidBudget: 'Enter an amount greater than zero.',
    safeDailyTitle: 'Safe daily limit',
    daysLeftSuffix: (days) =>
      days === 1 ? '1 day left this month' : `${days} days left this month`,
    weeklyGoalTitle: 'Weekly savings goal',
    weeklyGoalAction: 'Generate 9:16 Stories',
    weeklyGoalHint: 'Suggested weekly reserve',
    quickLogCta: 'Quick voice or photo log',
    quickLogLockedCta: 'Unlock unlimited logs',
    freePlanStatus: (used, limit) =>
      `Free plan · ${Math.min(used, limit)}/${limit} free logs used`,
    proPlanStatus: 'PaySnap Pro · Unlimited logs',
    upgradeLink: 'Upgrade to Pro',
    recentTitle: 'Recent transactions',
    recentEmptyTitle: 'No expenses logged yet',
    recentEmptyBody:
      'Tap the button above to snap a receipt, transfer screenshot, or speak an expense.',
    deleteExpenseLabel: (merchant) => `Delete expense at ${merchant}`,
    categories: {
      food: 'Food',
      transport: 'Transport',
      leisure: 'Leisure',
      bills: 'Bills',
      other: 'Other',
    },
    captureTitle: 'Quick AI expense log',
    captureSubtitle:
      'Upload a receipt photo or record a quick voice note. Gemini extracts the details instantly.',
    photoTab: 'Photo / Receipt',
    voiceTab: 'Voice',
    textTab: 'Text',
    uploadPhotoTitle: 'Receipt or transfer screenshot',
    uploadPhotoHint: 'JPG, PNG or WebP from camera or gallery',
    choosePhotoBtn: 'Take photo or choose file',
    changePhotoBtn: 'Change image',
    analyzePhotoBtn: 'Extract from image',
    voiceReadyHint: 'Tap to record what you spent (e.g., "18 dollars at Starbucks").',
    startRecording: 'Record voice',
    stopRecording: 'Stop recording',
    recordingNow: 'Recording… tap to stop',
    analyzeVoiceBtn: 'Analyze voice note',
    reRecordBtn: 'Record again',
    micUnavailableError:
      'Microphone unavailable in this browser. Use Photo or Text instead.',
    textInputLabel: 'Describe the expense quickly',
    textInputPlaceholder: 'e.g., $42.50 late-night food delivery',
    analyzeTextBtn: 'Log with AI',
    analyzingLabel: 'Judging your financial choices...',
    analyzingSubtitle: 'Reading the amount, merchant, and preparing your AI roast.',
    resultTitle: 'Expense logged!',
    shareStoriesBtn: 'Share to Stories',
    doneBtn: 'Back to dashboard',
    storiesTitle: 'Stories Card (9:16)',
    storiesSubtitle: 'Ready to post on Instagram or TikTok.',
    storiesDownloadBtn: 'Download PNG (9:16)',
    storiesDownloaded: 'PNG downloaded!',
    storiesMonthlySaved: 'Monthly remaining',
    storiesLatestRoast: 'Latest AI roast',
    installApp: 'Install App',
    installIOS: 'Install on iOS',
    iosModalTitle: 'Install PaySnap on iPhone',
    iosModalBody:
      'Tap the Share button in Safari and select "Add to Home Screen".',
    offlineBadge: 'Offline mode — showing locally cached data.',
    paywall: {
      kicker: 'PaySnap Pro',
      limitBanner: 'You reached the 3 free expense limit.',
      title: 'Your wallet needs a responsible adult',
      subtitle:
        'Unlock unlimited AI tracking for receipts, transfers, and impulse buys before payday.',
      benefits: [
        'Unlimited photo and voice expense logs',
        'Personalized AI roasts',
        'Unlimited 9:16 Stories generator',
      ],
      monthlyName: 'Monthly Plan',
      annualName: 'Annual Plan',
      popularTag: 'Most Popular - Save 50%',
      subscribeNowBtn: 'Subscribe Now',
      checkoutTitle: 'PaySnap Pro Checkout',
      checkoutSubtitle:
        'Test checkout screen to verify unlocking Pro status on your user record.',
      selectedPlanLabel: 'Selected plan',
      externalCheckoutBtn: 'Open external payment link',
      simulateApprovedBtn: 'Simulate Approved Payment',
      simulatingBtn: 'Activating PaySnap Pro…',
      backToPlansBtn: 'Back to plans',
      testNotice:
        'Simulating approval sets is_pro: true on your user profile right away.',
      successTitle: 'PaySnap Pro unlocked!',
      successSubtitle:
        'Your account now has unlimited photo, voice, and 9:16 Stories access.',
      continueCaptureBtn: 'Log new expense now',
      backDashboardBtn: 'Back to dashboard',
      updateError: 'Could not activate Pro right now. Please try again.',
    },
  },
};
