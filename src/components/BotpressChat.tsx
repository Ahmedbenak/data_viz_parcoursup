import React, { useEffect } from 'react';

const BotpressChat: React.FC = () => {
  useEffect(() => {
    // 1. Inject the main Botpress Webchat script
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.botpress.cloud/webchat/v3.6/inject.js';
    script1.async = true;
    document.body.appendChild(script1);

    // 2. Inject the specific bot configuration script
    const script2 = document.createElement('script');
    script2.src = 'https://files.bpcontent.cloud/2026/03/27/13/20260327131521-I1Q8K7WO.js';
    script2.async = true;
    script2.defer = true;
    document.body.appendChild(script2);

    return () => {
      // Cleanup scripts on unmount if necessary
      document.body.removeChild(script1);
      document.body.removeChild(script2);
      
      // Also remove the botpress container if it exists
      const botpressContainer = document.getElementById('bp-web-widget-container');
      if (botpressContainer) {
        botpressContainer.remove();
      }
    };
  }, []);

  return null; // This component doesn't render anything itself
};

export default BotpressChat;
