/**
 * QuickActions Component
 * Undo/Redo, Reset, and Save Preset actions
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Undo2, Redo2, RotateCcw, Save } from 'lucide-react';
import { Button } from '../../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Textarea } from '../../../ui/textarea';
import { ThemeV2 } from '../../../../types/theme';

interface QuickActionsProps {
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSavePreset: (name: string, description: string) => void;
  theme: Partial<ThemeV2>;
}

export function QuickActions({
  canUndo,
  canRedo,
  isDirty,
  onUndo,
  onRedo,
  onReset,
  onSavePreset,
  theme,
}: QuickActionsProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim(), presetDescription.trim());
      setPresetName('');
      setPresetDescription('');
      setSaveDialogOpen(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {/* Undo/Redo Row */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex-1 gap-2"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
            <span>Undo</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex-1 gap-2"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
            <span>Redo</span>
          </Button>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={!isDirty}
          className="w-full gap-2 text-orange-600 hover:text-orange-700 hover:border-orange-600"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Default</span>
        </Button>

        {/* Save as Preset Button */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setSaveDialogOpen(true)}
          className="w-full gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save as Preset</span>
        </Button>
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Custom Preset</DialogTitle>
            <DialogDescription>
              Create a reusable preset from your current theme settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., My Corporate Theme"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-description">Description (Optional)</Label>
              <Textarea
                id="preset-description"
                placeholder="Describe your preset..."
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Preview Colors */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Preview</Label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div
                  className="w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: theme.primaryColor }}
                  title="Primary Color"
                />
                <div
                  className="w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: theme.backgroundColor }}
                  title="Background Color"
                />
                <div
                  className="w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: theme.accentColor }}
                  title="Accent Color"
                />
                <div className="flex-1 text-xs text-gray-600 dark:text-gray-400">
                  {theme.fontFamily?.split(',')[0] || 'Default Font'}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
