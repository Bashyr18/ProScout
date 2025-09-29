import React, { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export const useFocusTrap = (containerRef: React.RefObject<HTMLElement>, isOpen: boolean) => {
    const lastFocusedElementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        lastFocusedElementRef.current = document.activeElement as HTMLElement;
        const focusableElements = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
        
        if (focusableElements.length > 0) {
            // Focus the first element, often the close button or first input
            focusableElements[0].focus();
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab' || !containerRef.current) return;

            const focusableElements = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const currentActiveElement = document.activeElement;

            if (event.shiftKey) { // Shift + Tab
                if (currentActiveElement === firstElement) {
                    lastElement.focus();
                    event.preventDefault();
                }
            } else { // Tab
                if (currentActiveElement === lastElement) {
                    firstElement.focus();
                    event.preventDefault();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            // Return focus to the element that opened the modal
            lastFocusedElementRef.current?.focus();
        };
    }, [isOpen, containerRef]);
};
