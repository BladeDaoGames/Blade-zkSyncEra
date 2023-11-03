import {
  Approval as ApprovalEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Transfer as TransferEvent
} from "../generated/BladeDAOToken/BladeDAOToken";
import { Approval, OwnershipTransferred, Transfer,
  User, UserCounter, TransferCounter } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.spender = event.params.spender
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  
  let day = event.block.timestamp.div(BigInt.fromI32(60 * 60 * 24));

  let userFrom = User.load(event.params.from.toHex());
  if (userFrom == null) {
    userFrom = newUser(event.params.from.toHex(), event.params.from.toHex());
  }
  userFrom.balance = userFrom.balance.minus(event.params.value);
  userFrom.transactionCount = userFrom.transactionCount + 1;
  userFrom.save();

  let userTo = User.load(event.params.to.toHex());
  if (userTo == null) {
    userTo = newUser(event.params.to.toHex(), event.params.to.toHex());

    // UserCounter
    let userCounter = UserCounter.load("singleton");
    if (userCounter == null) {
      userCounter = new UserCounter("singleton");
      userCounter.count = 1;
    } else {
      userCounter.count = userCounter.count + 1;
    }
    userCounter.save();
    userCounter.id = day.toString();
    userCounter.save();
  }
  userTo.balance = userTo.balance.plus(event.params.value);
  userTo.transactionCount = userTo.transactionCount + 1;
  userTo.save();

  // Transfer counter total and historical
  let transferCounter = TransferCounter.load("singleton");
  if (transferCounter == null) {
    transferCounter = new TransferCounter("singleton");
    transferCounter.count = 0;
    transferCounter.totalTransferred = BigInt.fromI32(0);
  }
  transferCounter.count = transferCounter.count + 1;
  transferCounter.totalTransferred = transferCounter.totalTransferred.plus(
    event.params.value
  );
  transferCounter.save();
  transferCounter.id = day.toString();
  transferCounter.save();


  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

function newUser(id: string, address: string): User {
  let user = new User(id);
  user.address = address;
  user.balance = BigInt.fromI32(0);
  user.transactionCount = 0;
  return user;
}
