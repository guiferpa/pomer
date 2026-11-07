import type { BlindStructure, StructureDraft } from "@/types/tournament";

import React, { useState } from "react";
import { Button, Card, Link } from "@heroui/react";

import { ConfirmModal } from "./confirm-modal";
import { SettingsMenu } from "./settings-menu";
import { StructureEditor } from "./structure-editor";

import { ROUTE_HASHES, navigateTo, useI18n } from "@/hooks";
import {
  clearDraft,
  deleteStructure,
  loadDraft,
  loadStructures,
  saveDraft,
  saveStructure,
} from "@/utils/persistence";
import {
  emptyStructureDraft,
  sameDraft,
  structureToDraft,
} from "@/utils/structures";

// Leva à tela de estruturas pelo endereço dela.
export const ManageStructuresLink: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { t } = useI18n();

  return (
    <Link
      className={className}
      href={ROUTE_HASHES.structures}
      onPress={() => navigateTo("structures")}
    >
      {t("manageStructures")}
    </Link>
  );
};

// O rascunho guardado, para o editor reabrir depois de um refresh. Se ele é a
// edição de uma estrutura que foi excluída nesse meio-tempo, reabre como uma
// estrutura nova, com o que foi digitado: nada se perde, e salvar cria outra.
const restoreDraft = (structures: BlindStructure[]): StructureDraft | null => {
  const stored = loadDraft();

  if (!stored?.id || structures.some((s) => s.id === stored.id)) return stored;

  const { id: _, ...asNew } = stored;

  saveDraft(asNew);

  return asNew;
};

interface StructuresScreenProps {
  onBack: () => void;
}

// A tela de estruturas de blinds: a lista das estruturas salvas e o editor.
export const StructuresScreen: React.FC<StructuresScreenProps> = ({
  onBack,
}) => {
  const { t } = useI18n();
  const [structures, setStructures] =
    useState<BlindStructure[]>(loadStructures);
  // A estrutura em edição, guardada a cada mudança para sobreviver a um
  // refresh; sem ela, a tela mostra a lista.
  const [draft, setDraft] = useState<StructureDraft | null>(() =>
    restoreDraft(structures),
  );
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const editDraft = (next: StructureDraft) => {
    saveDraft(next);
    setDraft(next);
  };

  // Salvar ou descartar apaga o rascunho.
  const closeEditor = () => {
    clearDraft();
    setDraft(null);
  };

  const handleSave = (structure: BlindStructure) => {
    saveStructure(structure);
    setStructures(loadStructures());
    closeEditor();
  };

  // Como o rascunho era ao ser aberto: vazio, ou a estrutura salva em edição.
  const opened = (current: StructureDraft): StructureDraft => {
    const editing = structures.find((s) => s.id === current.id);

    return editing ? structureToDraft(editing) : emptyStructureDraft();
  };

  // Do editor, voltar leva à lista, pedindo confirmação se há mudanças não
  // salvas; da lista, ao formulário de torneio.
  const handleBack = () => {
    if (!draft) return onBack();
    if (sameDraft(draft, opened(draft))) return closeEditor();
    setConfirmingDiscard(true);
  };

  // A estrutura cuja exclusão aguarda confirmação.
  const [deleting, setDeleting] = useState<BlindStructure | null>(null);

  const handleDelete = () => {
    if (!deleting) return;
    deleteStructure(deleting.id);
    setStructures(loadStructures());
  };

  const withName = (
    key: "editStructureNamed" | "deleteStructureNamed" | "deleteStructureMessage",
    structure: BlindStructure,
  ) => t(key).replace("{name}", structure.name);

  const levelCount = (n: number) =>
    `${n} ${n === 1 ? t("levelSingular") : t("levelPlural")}`;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col">
      <Card>
        <Card.Header className="flex flex-row items-center justify-between gap-2">
          <Button size="sm" variant="tertiary" onPress={handleBack}>
            {t("back")}
          </Button>
          <h1 className="text-xl font-bold">{t("structuresTitle")}</h1>
          <SettingsMenu />
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          {draft ? (
            <StructureEditor
              draft={draft}
              saved={structures}
              onChange={editDraft}
              onSave={handleSave}
            />
          ) : (
            <>
              <Button
                variant="primary"
                onPress={() => editDraft(emptyStructureDraft())}
              >
                {t("newStructure")}
              </Button>
              {structures.length === 0 ? (
                <p className="text-center text-muted">{t("noStructuresYet")}</p>
              ) : (
                <ul
                  aria-label={t("structuresTitle")}
                  className="flex flex-col gap-2"
                >
                  {structures.map((structure) => (
                    <li
                      key={structure.id}
                      className="flex justify-between items-center p-3 bg-surface-secondary rounded-lg"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">
                          {structure.name}
                        </span>
                        <span className="text-sm text-muted">
                          {levelCount(structure.levels.length)}
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          aria-label={withName("editStructureNamed", structure)}
                          size="sm"
                          variant="secondary"
                          onPress={() => editDraft(structureToDraft(structure))}
                        >
                          {t("edit")}
                        </Button>
                        <Button
                          aria-label={withName("deleteStructureNamed", structure)}
                          size="sm"
                          variant="danger-soft"
                          onPress={() => setDeleting(structure)}
                        >
                          {t("delete")}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Card.Content>
      </Card>
      <ConfirmModal
        cancelText={t("cancel")}
        confirmText={t("delete")}
        isOpen={deleting !== null}
        message={deleting ? withName("deleteStructureMessage", deleting) : ""}
        title={t("deleteStructureTitle")}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
      <ConfirmModal
        cancelText={t("keepEditing")}
        confirmText={t("discard")}
        isOpen={confirmingDiscard}
        message={t("discardChangesMessage")}
        title={t("discardChangesTitle")}
        onClose={() => setConfirmingDiscard(false)}
        onConfirm={closeEditor}
      />
    </div>
  );
};
