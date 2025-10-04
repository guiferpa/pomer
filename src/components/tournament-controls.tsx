import React from "react";
import { Button, Card, CardBody } from "@heroui/react";

interface TournamentControlsProps {
  isRunning: boolean;
  onToggle: () => void;
  onNextLevel: () => void;
  onReset: () => void;
}

export const TournamentControls: React.FC<TournamentControlsProps> = ({
  isRunning,
  onToggle,
  onNextLevel,
  onReset,
}) => {
  return (
    <Card className="w-full">
      <CardBody>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            className="flex-1"
            color={isRunning ? "warning" : "success"}
            size="lg"
            onClick={onToggle}
          >
            {isRunning ? "Pausar" : "Retomar"}
          </Button>

          <Button
            className="flex-1"
            color="primary"
            size="lg"
            onClick={onNextLevel}
          >
            Próximo Nível
          </Button>

          <Button
            className="flex-1"
            color="danger"
            size="lg"
            variant="flat"
            onClick={onReset}
          >
            Reset
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
