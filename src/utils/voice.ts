export function speak(text: string) {
  if (!window.speechSynthesis) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Detect if text contains Chinese characters
  const isChinese = /[\u4e00-\u9fa5]/.test(text);
  utterance.lang = isChinese ? 'zh-CN' : 'en-US';
  
  utterance.rate = 1;
  utterance.pitch = 1;
  
  window.speechSynthesis.speak(utterance);
}

export function announceTurn(name: string) {
  const isChinese = /[\u4e00-\u9fa5]/.test(name);
  if (isChinese) {
    speak(`接下来，有请 ${name}`);
  } else {
    speak(`Next up, ${name}.`);
  }
}
