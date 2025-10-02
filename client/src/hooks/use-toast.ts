// Hook toast de fallback simple pour remplacer les toasts manquants
export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant = "default", duration = 4000 }: ToastProps) => {
    console.log(`[Toast] ${title}: ${description}`);
    
    // Créer une notification simple dans le DOM
    const notification = document.createElement('div');
    const isError = variant === 'destructive';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: ${isError ? '#fee2e2' : '#f0fdf4'};
      border: 2px solid ${isError ? '#ef4444' : '#22c55e'};
      color: ${isError ? '#dc2626' : '#16a34a'};
      padding: 1rem;
      border-radius: 8px;
      max-width: 300px;
      font-family: system-ui;
      font-size: 14px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    `;
    
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">${title || 'Notification'}</div>
      <div>${description || ''}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer après la durée spécifiée
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, duration);
  };

  return { toast };
}