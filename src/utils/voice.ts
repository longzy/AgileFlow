export function speak(text: string) {
  if (!window.speechSynthesis) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1;
  utterance.pitch = 1;
  
  window.speechSynthesis.speak(utterance);
}

export function announceTurn(name: string) {
  speak(`${name}, it's your turn.`);
}
