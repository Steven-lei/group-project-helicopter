export default function PetPromptBubble({ message }) {
  return (
    <div className="bubble">
      <strong>MoodPal says:</strong>
      <p>{message}</p>
    </div>
  );
}
