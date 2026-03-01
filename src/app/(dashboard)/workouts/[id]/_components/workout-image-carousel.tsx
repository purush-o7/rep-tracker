"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { WorkoutImage } from "@/lib/types";

interface WorkoutImageCarouselProps {
  images: WorkoutImage[];
}

export function WorkoutImageCarousel({ images }: WorkoutImageCarouselProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (images.length === 0) return null;

  return (
    <Carousel className="w-full">
      <CarouselContent>
        {images.map((image) => (
          <CarouselItem key={image.id}>
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={`${supabaseUrl}/storage/v1/object/public/workout-images/${image.storage_path}`}
                alt="Workout"
                fill
                className="object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 && (
        <>
          <CarouselPrevious />
          <CarouselNext />
        </>
      )}
    </Carousel>
  );
}
