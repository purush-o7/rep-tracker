"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { toast } from "sonner";
import {
  invitePartnerSchema,
  type InvitePartnerInput,
} from "@/lib/validators/partner";
import { sendPartnerInvite } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function InvitePartnerForm() {
  const [loading, setLoading] = useState(false);

  const form = useForm<InvitePartnerInput>({
    resolver: zodResolver(invitePartnerSchema),
    defaultValues: { handle: "" },
  });

  const onSubmit = async (data: InvitePartnerInput) => {
    setLoading(true);
    const result = await sendPartnerInvite(data);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Partner invitation sent!");
      form.reset();
    }
    setLoading(false);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex items-end gap-2"
      >
        <FormField
          control={form.control}
          name="handle"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Invite a Partner</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                  <Input
                    className="pl-7"
                    placeholder="john_doe"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value.toLowerCase())
                    }
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          <Send className="mr-2 h-4 w-4" />
          {loading ? "Sending..." : "Invite"}
        </Button>
      </form>
    </Form>
  );
}
