/// A minimal receipt book for DeepBook Predict quick bets.
/// Records each Predict mint as an on-chain receipt with status lifecycle:
/// Pending -> Redeemed | Expired.
module quickbet_receipt::quickbet_receipt;

use sui::object::{Self, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use sui::event;
use std::string::String;

// ─── Status constants ──────────────────────────────────────

/// Receipt is awaiting redeem.
const STATUS_PENDING: u8 = 0;
/// Receipt has been redeemed (settled).
const STATUS_REDEEMED: u8 = 1;
/// Receipt expired without redeem.
const STATUS_EXPIRED: u8 = 2;

// ─── Side constants ────────────────────────────────────────

#[allow(unused_const)]
const SIDE_UP: u8 = 0;
#[allow(unused_const)]
const SIDE_DOWN: u8 = 1;
const SIDE_RANGE: u8 = 2;

// ─── Error codes ──────────────────────────────────────────

const EInvalidSide: u64 = 1;
const EInvalidStatus: u64 = 2;

// ─── Admin capability ─────────────────────────────────────

public struct AdminCap has key, store {
    id: UID,
}

// ─── Core receipt object ───────────────────────────────────

public struct QuickBetReceipt has key, store {
    id: UID,
    owner: address,
    market_key: String,
    side: u8,
    size: u64,
    tx_digest: String,
    status: u8,
}

// ─── Events ────────────────────────────────────────────────

public struct ReceiptCreated has copy, drop {
    owner: address,
    market_key: String,
    side: u8,
    size: u64,
}

public struct StatusUpdated has copy, drop {
    old_status: u8,
    new_status: u8,
}

// ─── Public functions ──────────────────────────────────────

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::share_object(admin_cap);
}

public fun create_receipt(
    _admin: &AdminCap,
    owner: address,
    market_key: String,
    side: u8,
    size: u64,
    tx_digest: String,
    ctx: &mut TxContext,
): QuickBetReceipt {
    assert!(side <= SIDE_RANGE, EInvalidSide);

    let receipt = QuickBetReceipt {
        id: object::new(ctx),
        owner,
        market_key,
        side,
        size,
        tx_digest,
        status: STATUS_PENDING,
    };

    event::emit(ReceiptCreated {
        owner: receipt.owner,
        market_key: receipt.market_key,
        side: receipt.side,
        size: receipt.size,
    });

    receipt
}

#[allow(lint(self_transfer))]
public fun transfer_receipt(receipt: QuickBetReceipt, ctx: &mut TxContext) {
    transfer::public_transfer(receipt, tx_context::sender(ctx));
}

public fun update_status(
    _admin: &AdminCap,
    receipt: &mut QuickBetReceipt,
    new_status: u8,
) {
    let old_status = receipt.status;
    assert!(old_status == STATUS_PENDING, EInvalidStatus);
    assert!(new_status == STATUS_REDEEMED || new_status == STATUS_EXPIRED, EInvalidStatus);

    receipt.status = new_status;

    event::emit(StatusUpdated {
        old_status,
        new_status,
    });
}

// ─── View functions ────────────────────────────────────────

public fun owner(receipt: &QuickBetReceipt): address { receipt.owner }
public fun market_key(receipt: &QuickBetReceipt): String { receipt.market_key }
public fun side(receipt: &QuickBetReceipt): u8 { receipt.side }
public fun size(receipt: &QuickBetReceipt): u64 { receipt.size }
public fun tx_digest(receipt: &QuickBetReceipt): String { receipt.tx_digest }
public fun status(receipt: &QuickBetReceipt): u8 { receipt.status }
