;; STX Transfer Smart Contract
;; A simple contract to transfer STX from one wallet to another

;; Error codes
(define-constant ERR-INVALID-AMOUNT (err u100))
(define-constant ERR-INVALID-RECIPIENT (err u101))
(define-constant ERR-TRANSFER-FAILED (err u102))
(define-constant ERR-INSUFFICIENT-BALANCE (err u103))

;; Events are emitted via print
(define-data-var transfer-count uint u0)

;; Read-only function to get current transfer count
(define-read-only (get-transfer-count)
    (var-get transfer-count)
)

;; Read-only function to check STX balance
(define-read-only (get-balance (account principal))
    (stx-get-balance account)
)

;; Main transfer function
;; Transfers STX from sender to recipient
(define-public (transfer-stx (amount uint) (recipient principal))
    (begin
        ;; Validate amount
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        
        ;; Validate recipient is not sender
        (asserts! (not (is-eq tx-sender recipient)) ERR-INVALID-RECIPIENT)
        
        ;; Check sender has sufficient balance
        (asserts! (>= (stx-get-balance tx-sender) amount) ERR-INSUFFICIENT-BALANCE)
        
        ;; Transfer STX
        (match (stx-transfer? amount tx-sender recipient)
            success 
                (begin
                    ;; Increment transfer count
                    (var-set transfer-count (+ (var-get transfer-count) u1))
                    
                    ;; Print event
                    (print {
                        event: "stx-transfer",
                        sender: tx-sender,
                        recipient: recipient,
                        amount: amount,
                        transfer-id: (var-get transfer-count)
                    })
                    
                    (ok true)
                )
            error ERR-TRANSFER-FAILED
        )
    )
)

;; Batch transfer function
;; Transfer STX to multiple recipients
(define-public (batch-transfer (recipients (list 20 {recipient: principal, amount: uint})))
    (begin
        (asserts! (> (len recipients) u0) ERR-INVALID-AMOUNT)
        
        ;; Process all transfers
        (ok (map process-single-transfer recipients))
    )
)

;; Helper function for batch transfers
(define-private (process-single-transfer (transfer-data {recipient: principal, amount: uint}))
    (let
        (
            (recipient (get recipient transfer-data))
            (amount (get amount transfer-data))
        )
        (match (stx-transfer? amount tx-sender recipient)
            success 
                (begin
                    (var-set transfer-count (+ (var-get transfer-count) u1))
                    (print {
                        event: "stx-batch-transfer",
                        sender: tx-sender,
                        recipient: recipient,
                        amount: amount,
                        transfer-id: (var-get transfer-count)
                    })
                    true
                )
            error false
        )
    )
)

;; Transfer with memo
;; Allows adding a message to the transfer
(define-public (transfer-stx-memo (amount uint) (recipient principal) (memo (string-utf8 256)))
    (begin
        ;; Validate inputs
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        (asserts! (not (is-eq tx-sender recipient)) ERR-INVALID-RECIPIENT)
        (asserts! (>= (stx-get-balance tx-sender) amount) ERR-INSUFFICIENT-BALANCE)
        
        ;; Transfer STX
        (match (stx-transfer? amount tx-sender recipient)
            success 
                (begin
                    (var-set transfer-count (+ (var-get transfer-count) u1))
                    
                    ;; Print event with memo
                    (print {
                        event: "stx-transfer-memo",
                        sender: tx-sender,
                        recipient: recipient,
                        amount: amount,
                        memo: memo,
                        transfer-id: (var-get transfer-count)
                    })
                    
                    (ok true)
                )
            error ERR-TRANSFER-FAILED
        )
    )
)

;; Split transfer
;; Split an amount equally between multiple recipients
(define-public (split-transfer (total-amount uint) (recipients (list 10 principal)))
    (let
        (
            (recipient-count (len recipients))
            (amount-per-recipient (/ total-amount recipient-count))
        )
        (begin
            ;; Validate inputs
            (asserts! (> total-amount u0) ERR-INVALID-AMOUNT)
            (asserts! (> recipient-count u0) ERR-INVALID-RECIPIENT)
            (asserts! (>= (stx-get-balance tx-sender) total-amount) ERR-INSUFFICIENT-BALANCE)
            
            ;; Process transfers
            (ok (map split-transfer-single amount-per-recipient recipients))
        )
    )
)

;; Helper function for split transfers
(define-private (split-transfer-single (amount uint) (recipient principal))
    (match (stx-transfer? amount tx-sender recipient)
        success 
            (begin
                (var-set transfer-count (+ (var-get transfer-count) u1))
                (print {
                    event: "stx-split-transfer",
                    sender: tx-sender,
                    recipient: recipient,
                    amount: amount,
                    transfer-id: (var-get transfer-count)
                })
                true
            )
        error false
    )
)

;; Read-only function to check if transfer would succeed
(define-read-only (can-transfer (sender principal) (amount uint))
    (and
        (> amount u0)
        (>= (stx-get-balance sender) amount)
    )
)
