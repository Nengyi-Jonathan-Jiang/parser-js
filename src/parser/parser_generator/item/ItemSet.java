package frontend.parser.parser_generator.item;

import frontend.util.Printable;
import frontend.util.ComparableTreeSet;

public class ItemSet extends ComparableTreeSet<Item> implements Printable{

    public ItemSet(){}

    public ItemSet(Item item){
        add(item);
    }

    @Override
    public String toString(){
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        for(Item it : this){
            sb.append("\n\t");
            sb.append(it.toString());
        }
        sb.append("\n}");
        return sb.toString();
    }

    public ItemSet copy(){
        return (ItemSet) clone();
    }
}