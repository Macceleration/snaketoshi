import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { getRoomAdapter } from '@/lib/roomAdapter';

interface JoinRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinRoomDialog({ isOpen, onClose }: JoinRoomDialogProps) {
  const [roomCode, setRoomCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoin = async () => {
    const code = roomCode.trim().toUpperCase();
    
    if (!code) {
      toast({
        title: 'Code required',
        description: 'Please enter a room code',
        variant: 'destructive',
      });
      return;
    }

    if (code.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Room codes are 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsChecking(true);

    try {
      const adapter = getRoomAdapter();
      
      // Find room by code
      const rooms = Array.from((adapter as any).rooms.values());
      const room = rooms.find((r: any) => r.code === code);
      
      if (!room) {
        toast({
          title: 'Room not found',
          description: 'Check the code and try again',
          variant: 'destructive',
        });
        setIsChecking(false);
        return;
      }

      // Navigate to join page
      navigate(`/room/${room.id}/join`);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to find room',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Room</DialogTitle>
          <DialogDescription>
            Enter the 6-character room code shared by your friend
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="room-code">Room Code</Label>
            <Input
              id="room-code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="text-center text-2xl font-mono tracking-wider uppercase"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJoin();
                }
              }}
            />
          </div>

          <Button
            onClick={handleJoin}
            disabled={isChecking || roomCode.length !== 6}
            className="w-full"
            size="lg"
          >
            {isChecking ? 'Finding room...' : 'Join Room'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
