import React, { createContext, useContext, useState, useCallback } from 'react'

const ModalContext = createContext(null)

export function ModalProvider({ children }){
  const [modal, setModal] = useState(null)

  const close = useCallback(() => setModal(null), [])

  const showAlert = useCallback((message) => {
    return new Promise((resolve) => {
      setModal({ type: 'alert', message, resolve })
    })
  }, [])

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      setModal({ type: 'confirm', message, resolve })
    })
  }, [])

  const handleClose = useCallback(() => {
    if (!modal) return
    modal.resolve && modal.resolve(true)
    setModal(null)
  }, [modal])

  const handleCancel = useCallback(() => {
    if (!modal) return
    modal.resolve && modal.resolve(false)
    setModal(null)
  }, [modal])

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={handleCancel}></div>
          <div className="bg-[#0b1220] text-white neo-card p-6 z-10 max-w-lg w-full">
            <div className="text-lg font-semibold mb-2">{modal.type === 'confirm' ? 'Confirm' : 'Notice'}</div>
            <div className="text-sm mb-4">{String(modal.message)}</div>
            <div className="flex justify-end gap-2">
              {modal.type === 'confirm' ? (
                <>
                  <button className="neo-ghost" onClick={handleCancel}>Cancel</button>
                  <button className="neo-btn" onClick={handleClose}>OK</button>
                </>
              ) : (
                <button className="neo-btn" onClick={handleClose}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export function useModal(){
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}

export default ModalContext
