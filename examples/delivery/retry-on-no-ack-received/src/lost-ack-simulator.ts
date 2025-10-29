import type {
  FameDeliveryContext,
  FameEnvelope,
  DeliveryAckFrame,
} from "@naylence/core";
import type { NodeEventListener, NodeLike } from "@naylence/runtime";

/**
 * Drops most delivery acknowledgments to exercise the retry policy.
 * Not suitable for production deployments.
 */
export class LostAckSimulator implements NodeEventListener {
  readonly priority = 1000;

  private deliveryAckCounter = 0;

  async onForwardUpstream(
    _node: NodeLike,
    envelope: FameEnvelope,
    _context?: FameDeliveryContext,
  ): Promise<FameEnvelope | null> {
    const frame = envelope.frame as DeliveryAckFrame | undefined;
    if (!frame || frame.type !== "DeliveryAck") {
      return envelope;
    }

    this.deliveryAckCounter += 1;
    if (this.deliveryAckCounter % 3 !== 0) {
      const refId =
        (frame as { ref_id?: string }).ref_id ??
        (frame as { refId?: string }).refId ??
        "unknown";
      console.log("Simulating lost acknowledgment to envelope id", refId);
      return null;
    }

    return envelope;
  }
}
