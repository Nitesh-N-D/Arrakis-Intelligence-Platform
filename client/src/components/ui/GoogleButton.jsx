import Button from "./Button";

export default function GoogleButton({ disabled, onClick }) {
  return (
    <Button className="w-full" variant="secondary" disabled={disabled} onClick={onClick}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.4c-.2 1.3-.8 2.3-1.7 3.1l2.8 2.2c1.7-1.5 2.7-3.8 2.7-6.4 0-.6-.1-1.2-.2-1.8H12Z"
        />
        <path
          fill="#34A853"
          d="M12 21c2.4 0 4.5-.8 6-2.1l-2.8-2.2c-.8.6-1.8 1-3.2 1-2.5 0-4.7-1.7-5.4-4l-2.9 2.2C5.2 18.9 8.3 21 12 21Z"
        />
        <path
          fill="#4A90E2"
          d="M6.6 13.7c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7L3.7 8.1C3 9.4 2.6 10.7 2.6 12s.4 2.6 1.1 3.9l2.9-2.2Z"
        />
        <path
          fill="#FBBC05"
          d="M12 6.3c1.4 0 2.7.5 3.7 1.4l2.7-2.7C16.5 3.4 14.4 2.5 12 2.5c-3.7 0-6.8 2.1-8.3 5.1l2.9 2.2c.7-2.3 2.9-3.5 5.4-3.5Z"
        />
      </svg>
      Continue with Google
    </Button>
  );
}
