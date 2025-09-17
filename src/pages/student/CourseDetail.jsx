import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTourLMS } from '@/contexts/TourLMSContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, FileText, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CourseOverview from '@/components/course/CourseOverview';
import CourseContent from '@/components/course/CourseContent';
import CourseForum from '@/components/course/CourseForum';
import { clg, ocn } from '../../lib/basic';
import { image_01, image_02 } from '../../js/Data';

const CourseDetail = () => {
  const { id } = useParams();
  const { user, token, CoursesHub, enrolledCourses, enrollments, setEnrollments } = useTourLMS();
  const { toast } = useToast();
  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    clg('i am called')
    const fetchCourseAndEnrollmentStatus = async () => {
      try {
        setLoading(true);
        
        // Find the course in CoursesHub by ID or key
        const foundCourse = CoursesHub?.find(c => c._id === id || c.key === id);
        clg('course found ---',foundCourse)
        if (foundCourse) {
          
          // Check enrollment status from server if user is logged in
          if (token) {
            try {
              const enrollmentStatus = user.enrolledCourses.find(id=>id === foundCourse.key);
              console.log(`enrollment status: ${enrollmentStatus}`);
              setIsEnrolled(enrollmentStatus?true:false);
              if(enrollmentStatus&&ocn(enrolledCourses)){
                const mycourse=enrolledCourses?.find(c => c._id === id || c.key === id);

                const enrollment = enrollments.find(enrollment => enrollment.course === mycourse.key);

                clg(`found enrollment: ${enrollments}`);
                mycourse.enrollment = enrollment;
                clg(`found course: ${mycourse}`);
                setCourse(mycourse);
              setLoading(false);
              }
              if(!enrollmentStatus&&foundCourse)setCourse(foundCourse);
        
              
              // If user is enrolled, default to content tab
              if (enrollmentStatus) {
                setActiveTab('content');
              }
            } catch (err) {
              console.error("Failed to check enrollment status:", err);
              setIsEnrolled(false);
            }
          }else{
            clg('token nodey');
            if(id)localStorage.setItem('waitingCourse',id)
            
            setCourse(foundCourse);
            setLoading(false);
          }
        } else {
          toast({
            title: 'Error',
            description: 'Course not found',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching course details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load course details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id && CoursesHub && CoursesHub.length > 0) {
      fetchCourseAndEnrollmentStatus();
    }
  }, [id, token, CoursesHub,enrolledCourses]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">Course Not Found</h2>
        <p className="text-slate-600 mt-2">The course you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  // If not enrolled, only show the overview
  if (!isEnrolled) {
    return <CourseOverview course={course} isEnrolled={isEnrolled} />;
  }

  // For enrolled students, show full course tabs
  return (
    <div className="container mx-auto p-6 mt-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{course.title}</h1>
        <p className="text-slate-600 dark:text-slate-300">{course.description}</p>
        <img 
          src={course.thumbnail|| image_02} 
          alt={`${course.title} thumbnail`} 
          className="w-full h-48 object-cover rounded-lg mt-4 lg:h-96"
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Content</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="forum" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Forum</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="content">
          <CourseContent course={course} />
        </TabsContent>
        
        <TabsContent value="overview">
          <CourseOverview course={course} isEnrolled={isEnrolled} />
        </TabsContent>
        
        <TabsContent value="forum">
          <CourseForum courseId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDetail;