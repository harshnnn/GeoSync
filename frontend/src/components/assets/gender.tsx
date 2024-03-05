import { useState } from 'react';
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react";


export function Gender({ onGenderSelect }) {
    const genders = [
        "Male",
        "Female",
        "Non-binary",
        "Genderqueer",
        "Genderfluid",
        "Agender",
        "Bigender",
        "Two-Spirit",
        "Demiboy",
        "Demigirl",
        "Gender nonconforming",
        "Gender questioning",
        "Androgynous",
        "Pangender",
        "Neutrois",
        "Polygender",
        "Transgender",
        "Cisgender",
        "Intergender",
        "Third gender",
        "Queer",
        "Questioning",
        "Intersex",
        "Attack Helicopter"
    ]

    const [searchTerm, setSearchTerm] = useState("");
    const [filteredGenders, setFilteredGenders] = useState(genders);

    const handleSearch = (event) => {
        const term = event.target.value;
        setSearchTerm(term);
        const filtered = genders.filter(gender =>
            gender.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredGenders(filtered);
    };



    return (
        <Dialog classname="overflow-scroll">
            <DialogTrigger asChild>
                <Button className='p-10'>Gender</Button>
            </DialogTrigger>
            

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Choose Gender</DialogTitle>
                    <DialogDescription>
                        Select the location of your choise, where u want to get matched with
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 ">
                    <div className="relative">
                        <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-8"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                    <DialogClose>
                    <div className="max-h-96 gap-y-2 overflow-y-auto flex flex-col">
                    
                        {filteredGenders.map((gender, index) => (
                            
                            <Button key={index} onClick={() => onGenderSelect(gender)} >
                                {gender}
                            </Button>
                            
                        ))}
                        
                    </div>
                    </DialogClose>
                </div>
            </DialogContent>
         
        </Dialog>
    )
}
