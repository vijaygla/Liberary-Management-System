export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'Admin' | 'Librarian' | 'Member' | string;
  phoneNumber?: string;
  address?: string;
  membershipCardNumber: string;
  membershipDate: string;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface Book {
  id: number;
  title: string;
  isbn: string;
  description: string;
  authorId: number;
  authorName: string;
  categoryId: number;
  categoryName: string;
  publisherId?: number;
  publisherName?: string;
  publishedYear: number;
  edition?: string;
  shelfLocation: string;
  coverImageUrl?: string;
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
}

export interface BookQueryParams {
  search?: string;
  categoryId?: number;
  authorId?: number;
  availableOnly?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  bookCount: number;
}

export interface Author {
  id: number;
  name: string;
  biography?: string;
  nationality?: string;
  bookCount: number;
}

export interface BorrowRecord {
  id: number;
  bookId: number;
  bookTitle: string;
  bookIsbn: string;
  bookCoverUrl?: string;
  userId: number;
  userName: string;
  userEmail: string;
  membershipCardNumber: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Active' | 'Returned' | 'Overdue';
  fineAmount: number;
  finePaid: boolean;
  notes?: string;
}

export interface Reservation {
  id: number;
  bookId: number;
  bookTitle: string;
  bookIsbn: string;
  bookCoverUrl?: string;
  userId: number;
  userName: string;
  userEmail: string;
  reservationDate: string;
  status: 'Pending' | 'Fulfilled' | 'Cancelled';
  notes?: string;
}

export interface CategoryCount {
  categoryName: string;
  bookCount: number;
}

export interface MonthlyBorrow {
  month: string;
  count: number;
}

export interface DashboardStats {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  activeLoansCount: number;
  overdueLoansCount: number;
  activeMembersCount: number;
  pendingReservationsCount: number;
  totalPendingFines: number;
  recentBorrows: BorrowRecord[];
  categoryDistribution: CategoryCount[];
  monthlyBorrowTrends: MonthlyBorrow[];
}
