"use client";

import { useState } from "react";
import { GoogleButton } from "@/components/google-button";

export function LoginCard() {
  const [clicked, setClicked] = useState(false);
  return (
    <div className="mt-6">
      <GoogleButton onClick={() => setClicked(true)} />
      {clicked && (
        <p role="status" className="appear mt-3 text-sm text-muted">
          בגרסת ההדגמה ההתחברות עדיין לא מחוברת. בשלב הבא היא תעבוד מול Google.
        </p>
      )}
    </div>
  );
}
