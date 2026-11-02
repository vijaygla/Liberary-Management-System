import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Author,
  Book,
  BookQueryParams,
  BorrowRecord,
  Category,
  DashboardStats,
  PagedResult,
  Reservation,
  User
} from '../models/library.models';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // 1. Books
  getBooks(params: BookQueryParams = {}): Observable<PagedResult<Book>> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId.toString());
    if (params.authorId) httpParams = httpParams.set('authorId', params.authorId.toString());
    if (params.availableOnly) httpParams = httpParams.set('availableOnly', params.availableOnly.toString());
    if (params.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) httpParams = httpParams.set('sortDescending', params.sortDescending.toString());

    return this.http.get<PagedResult<Book>>(`${this.baseUrl}/books`, { params: httpParams });
  }

  getBook(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/books/${id}`);
  }

  createBook(book: Partial<Book>): Observable<Book> {
    return this.http.post<Book>(`${this.baseUrl}/books`, book);
  }

  updateBook(id: number, book: Partial<Book>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/books/${id}`, book);
  }

  deleteBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/books/${id}`);
  }

  // 2. Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  createCategory(category: { name: string; description?: string }): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, category);
  }

  updateCategory(id: number, category: { name: string; description?: string }): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }

  // 3. Authors
  getAuthors(): Observable<Author[]> {
    return this.http.get<Author[]>(`${this.baseUrl}/authors`);
  }

  createAuthor(author: { name: string; biography?: string; nationality?: string }): Observable<Author> {
    return this.http.post<Author>(`${this.baseUrl}/authors`, author);
  }

  // 4. Borrowing & Circulation
  borrowBook(req: { bookId: number; userId: number; dueDays?: number; notes?: string }): Observable<BorrowRecord> {
    return this.http.post<BorrowRecord>(`${this.baseUrl}/borrowrecords/borrow`, req);
  }

  returnBook(req: { borrowRecordId: number; notes?: string }): Observable<BorrowRecord> {
    return this.http.post<BorrowRecord>(`${this.baseUrl}/borrowrecords/return`, req);
  }

  payFine(borrowRecordId: number): Observable<{ message: string; amountPaid: number }> {
    return this.http.post<{ message: string; amountPaid: number }>(`${this.baseUrl}/borrowrecords/pay-fine`, { borrowRecordId });
  }

  getMyBorrowHistory(): Observable<BorrowRecord[]> {
    return this.http.get<BorrowRecord[]>(`${this.baseUrl}/borrowrecords/my-history`);
  }

  getAllBorrows(status?: string): Observable<BorrowRecord[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<BorrowRecord[]>(`${this.baseUrl}/borrowrecords`, { params });
  }

  // 5. Reservations
  reserveBook(req: { bookId: number; userId: number; notes?: string }): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations`, req);
  }

  getMyReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/my-reservations`);
  }

  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations`);
  }

  cancelReservation(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/reservations/${id}/cancel`, {});
  }

  fulfillReservation(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/reservations/${id}/fulfill`, {});
  }

  // 6. Dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard/stats`);
  }

  // 7. Users
  getUsers(role?: string, search?: string): Observable<User[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    if (search) params = params.set('search', search);
    return this.http.get<User[]>(`${this.baseUrl}/users`, { params });
  }
}
