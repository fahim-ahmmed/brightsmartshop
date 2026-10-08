'use client';

import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
import RegisterForm from './RegisterForm';

export default function RegisterModal({ isOpen, onOpenChange }) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" scrollBehavior="inside" size="xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-xs font-semibold tracking-wide text-primary">JOIN BRIGHT SMART SHOP</span>
              <span className="text-2xl">Create your client account</span>
              <span className="text-sm font-normal text-default-600">
                Register in a few seconds and start shopping with more value.
              </span>
            </ModalHeader>
            <ModalBody className="pb-6">
              <RegisterForm onSuccess={onClose} />
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
