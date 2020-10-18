import { Course } from './../models/course.model';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  course: Course = JSON.parse(localStorage.getItem('course') || null);

  constructor(private http: HttpClient) {} 

  postNewCourse(newCourse): Observable<any> {
    const { title, description } = newCourse;
    return this.http.post('http://localhost:5000/course/add', {
      title,
      student: [],
      teachers: ['bobby'],
      description,
    });
  }

  getCourseFiles(CourseId): Observable<any>{
    return this.http.get(`http://localhost:5000/documents/${CourseId}`, {})
  } 
}
