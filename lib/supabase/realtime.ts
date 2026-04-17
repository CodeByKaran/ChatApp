import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Room {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
  is_public: boolean;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export const subscribeToRooms = (callback: (rooms: Room[]) => void) => {
  return supabase
    .channel("public:rooms")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rooms",
      },
      (payload) => {
        // Fetch all rooms to get the updated list
        supabase
          .from("rooms")
          .select("*")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .then(({ data }) => {
            if (data) callback(data);
          });
      },
    )
    .subscribe();
};

export const subscribeToMessages = (
  roomId: string,
  callback: (messages: Message[]) => void,
) => {
  return supabase
    .channel(`public:messages:room:${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        // Fetch all messages for this room to get the updated list
        supabase
          .from("messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true })
          .then(({ data }) => {
            if (data) callback(data);
          });
      },
    )
    .subscribe();
};

export const createRoom = async (name: string, description?: string) => {
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      name,
      description,
      is_public: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const sendMessage = async (roomId: string, content: string) => {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      room_id: roomId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getRooms = async () => {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getMessages = async (roomId: string) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
};
