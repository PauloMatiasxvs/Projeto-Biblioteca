export type Book = {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  description: string | null;
  file_path: string;
  file_size: number;
  page_count: number | null;
  cover_hue: number;
  current_page: number;
  added_at: string;
  last_opened_at: string | null;
};

export type Profile = {
  id: string;
  display_name: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      books: {
        Row: Book;
        Insert: Omit<Book, 'id' | 'added_at' | 'last_opened_at' | 'current_page'> & {
          id?: string;
          added_at?: string;
          last_opened_at?: string | null;
          current_page?: number;
        };
        Update: Partial<Omit<Book, 'id' | 'user_id'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Profile;
        Update: Partial<Omit<Profile, 'id'>>;
      };
    };
  };
};
