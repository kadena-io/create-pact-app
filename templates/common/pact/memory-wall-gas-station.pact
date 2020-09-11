(namespace "free")
(module {{gasStationName}} GOVERNANCE
  (defcap GOVERNANCE ()
    "defines who can update the smart contract"
    true
    ; currently anyone can change your smart contract
    ; for added security replace 'true' with a keyset or account or make it immutable
    ;   keyset:
    ;     (enforce-guard (keyset-ref-guard 'YOUR-KEYSET))
    ;   account:
    ;     (enforce-guard (at 'guard (coin.details "YOUR-ACCOUNT-NAME")))
    ;   immutable:
    ;     false
  )

  (implements gas-payer-v1)
  (use coin)

  (defschema gas
    balance:decimal
    guard:guard)

  (deftable ledger:{gas})

  (defcap GAS_PAYER:bool
    ( user:string
      limit:integer
      price:decimal
    )
    (enforce (= "exec" (at "tx-type" (read-msg))) "Inside an exec")
    (enforce (= 1 (length (at "exec-code" (read-msg)))) "Tx of only one pact function")
    (enforce (= "(free.memory-wall." (take 18 (at 0 (at "exec-code" (read-msg))))) "only memory wall smart contract")
    (compose-capability (ALLOW_GAS))
  )

  (defcap ALLOW_GAS () true)

  (defun create-gas-payer-guard:guard ()
    (create-user-guard (gas-payer-guard))
  )

  (defun gas-payer-guard ()
    (require-capability (GAS))
    (require-capability (ALLOW_GAS))
  )
)
(coin.transfer-create "YOUR-ACCOUNT-NAME" "mw-free-gas" (free.memory-wall-gas-station.create-gas-payer-guard) 0.1)
