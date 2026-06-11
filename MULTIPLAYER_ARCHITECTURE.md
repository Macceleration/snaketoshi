# Cross-Device Multiplayer Architecture

## Backend Solution: Nostr Events

### Why Nostr for Room State?

Snaketoshi Squares uses **Nostr events for room state synchronization** while keeping **Nostr login optional for players**.

**Key Distinction:**
- **Room State Backend** = Nostr events (always, automatic, no login required)
- **Player Identity** = Optional Nostr profile OR guest name
- **Play Broadcasting** = Optional kind 1 notes (requires login)

### How It Works

**Room State Events (Kind 30078):**
```typescript
{
  kind: 30078, // Addressable event
  content: JSON.stringify(gameRoom), // Full room state
  tags: [
    ["d", roomId],
    ["code", "ABC123"],
    ["status", "lobby" | "active" | "complete"],
    ["t", "snaketoshi-room"]
  ]
}
```

**Ephemeral Keypair:**
- Each room has an auto-generated ephemeral keypair
- Room events are signed by room keypair (not player keypairs)
- No player login required
- Room persists on Nostr relays

**Guest Players:**
- Choose display name
- Get assigned color
- Join without Nostr account
- Can still play and see updates

**Nostr Players (Optional):**
- Can use Nostr profile name/avatar
- Can broadcast individual plays (kind 1)
- Still join using room mechanics (not Nostr DMs)

### Adapters

**LocalRoomAdapter:**
- localStorage + BroadcastChannel
- Same-browser testing
- Offline development
- Fallback mode

**NostrRoomAdapter:**
- Nostr events (kind 30078)
- Cross-device sync
- Public rooms or encrypted
- Production mode

### Room Flow

1. **Create Room:**
   - Generate ephemeral room keypair
   - Create kind 30078 event with room state
   - Publish to relays
   - Store room nsec locally for host actions

2. **Join Room:**
   - Fetch room event by code or ID
   - Add player to room state
   - Publish updated room event
   - Subscribe to room updates

3. **Gameplay:**
   - Host starts game → publishes event
   - Player rolls → publishes event
   - Player continues → publishes event
   - All devices subscribe and re-render

4. **Realtime Sync:**
   - REQ subscription to room's addressable event
   - Room updates trigger callback
   - UI re-renders with new state

### Security & Privacy

**Room Keypair Storage:**
- Host stores room nsec in localStorage
- Only host can modify room in some implementations
- OR: any player can update (optimistic, last-write-wins)

**Guest Privacy:**
- No Nostr account required
- Display name only
- No pubkey recorded unless opted in

**Data Retention:**
- Rooms persist on relays
- Can implement auto-expire after N days
- Kind 30078 is replaceable (only latest version kept)

### Configuration

**Environment Variables:**
```bash
VITE_MULTIPLAYER_MODE=nostr  # or "local"
VITE_NOSTR_RELAYS=wss://relay1.com,wss://relay2.com
```

**Runtime Detection:**
```typescript
const useNostrMultiplayer = import.meta.env.VITE_MULTIPLAYER_MODE === 'nostr';
const adapter = useNostrMultiplayer 
  ? new NostrRoomAdapter() 
  : new LocalRoomAdapter();
```

### Advantages

✅ No backend server hosting costs  
✅ Decentralized, censorship-resistant  
✅ Works across any device/browser  
✅ Guest players don't need Nostr  
✅ Nostr users get enhanced features  
✅ Real-time updates via subscriptions  
✅ Room state persists automatically  
✅ Compatible with existing Nostr infrastructure

### Limitations

⚠️ Public room state (unless encrypted)  
⚠️ Depends on relay availability  
⚠️ Potential write conflicts (mitigated with phase validation)  
⚠️ Room codes must be globally unique

### Alternatives Considered

**Firebase/Supabase:**
- ❌ Requires API keys and backend setup
- ❌ Hosting costs
- ❌ Not compatible with Shakespeare's philosophy

**WebRTC/PeerJS:**
- ❌ No room persistence
- ❌ Complex NAT traversal
- ❌ Host must stay connected

**WebSocket Server:**
- ❌ Requires backend hosting
- ❌ Single point of failure
- ❌ Not deployable to static hosts

**Nostr is the cleanest fit for this architecture.**
