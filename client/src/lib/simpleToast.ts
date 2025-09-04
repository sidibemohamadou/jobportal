// Système de notification simple pour remplacer useToast
export type ToastType = "info" | "success" | "error" | "warning";

export interface SimpleToast {
  title?: string;
  description: string;
  variant?: "default" | "destructive";
}

// Store simple pour les notifications
let toastContainer: HTMLElement | null = null;

export function showToast({ title, description, variant = "default" }: SimpleToast) {
  // Créer le container s'il n'existe pas
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'simple-toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 400px;
    `;
    document.body.appendChild(toastContainer);
  }

  // Créer l'élément toast
  const toast = document.createElement('div');
  toast.style.cssText = `
    margin-bottom: 10px;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background: ${variant === "destructive" ? "#fee2e2" : "#f0f9ff"};
    border: 1px solid ${variant === "destructive" ? "#fca5a5" : "#bae6fd"};
    color: ${variant === "destructive" ? "#dc2626" : "#0c4a6e"};
    animation: slideIn 0.3s ease-out;
  `;

  const content = `
    ${title ? `<div style="font-weight: bold; margin-bottom: 4px;">${title}</div>` : ''}
    <div>${description}</div>
  `;
  
  toast.innerHTML = content;
  toastContainer.appendChild(toast);

  // Auto-suppression après 5 secondes
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 5000);
}

// Hook simple pour remplacer useToast
export function useSimpleToast() {
  return {
    toast: showToast
  };
}

// Ajouter les animations CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}