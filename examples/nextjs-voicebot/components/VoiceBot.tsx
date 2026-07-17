"use client";

import {
  ConnectButton,
  ConnectionStatus,
  MicButton,
  Orb,
  Transcript,
  useJargoConnection,
} from "@gojargo/jargo-client-react/react";

export function VoiceBot() {
  const { error } = useJargoConnection();

  return (
    <main className="wrap">
      <header className="head">
        <h1>jargo voicebot</h1>
        <ConnectionStatus
          labels={{
            disconnected: "Déconnecté",
            connecting: "Connexion…",
            connected: "Connecté",
            ready: "En ligne",
            error: "Erreur",
          }}
        />
      </header>

      <div className="visual">
        <Orb size={200} />
      </div>

      <Transcript
        className="feed"
        roleLabels={{ user: "Vous", agent: "Assistant" }}
        emptyLabel="Cliquez sur Connecter, autorisez le micro, puis parlez."
      />

      {error && <p className="err">Erreur : {error.message}</p>}

      <div className="controls">
        <ConnectButton
          labels={{
            idle: "Connecter",
            connecting: "Connexion…",
            connected: "Raccrocher",
          }}
        />
        <MicButton
          labels={{ mute: "Couper le micro", unmute: "Activer le micro" }}
        />
      </div>
    </main>
  );
}
