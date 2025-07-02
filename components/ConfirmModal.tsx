'use client'
import { ReactNode } from 'react';

interface ConfirmModalProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow max-w-sm w-full">
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 border">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-1 bg-red-600 text-white">Confirm</button>
        </div>
      </div>
    </div>
  );
}
